import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocketEvents, Role } from '@fastfood/shared-types';
import { Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
  role: Role;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  },
  transports: ['websocket'], // No polling — websocket only
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  // Map of orderId → Set of socket IDs sharing location (rate-limit enforcement)
  private lastLocationEmit = new Map<string, number>();

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  // ── Connection: validate JWT on handshake ─────────────
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify<{ sub: string; role: Role }>(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      (client as AuthenticatedSocket).userId = payload.sub;
      (client as AuthenticatedSocket).role = payload.role;

      // Server joins rooms based on verified JWT — never from client input
      const ac = client as AuthenticatedSocket;

      if (ac.role === Role.RIDER) {
        await client.join(`riders:available`);
        this.logger.log(`Rider ${ac.userId} connected and joined riders:available`);
      } else if (ac.role === Role.CUSTOMER) {
        await client.join(`user:${ac.userId}`);
        this.logger.log(`Customer ${ac.userId} connected`);
      } else if (ac.role === Role.ADMIN || ac.role === Role.STAFF) {
        await client.join(`restaurant:main`);
        this.logger.log(`Staff ${ac.userId} joined restaurant:main`);
      }
    } catch {
      this.logger.warn('Rejected unauthenticated socket connection');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Rider: join order room after accepting ────────────
  @SubscribeMessage('join:order')
  async handleJoinOrder(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string },
  ) {
    if (!client.userId) return;
    // Only riders and customers join order rooms — authorized by server
    await client.join(`order:${data.orderId}`);
  }

  // ── Rider: emit location (rate-limited, 5s minimum) ───
  @SubscribeMessage(SocketEvents.RIDER_LOCATION_EMIT)
  async handleRiderLocation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string; lat: number; lng: number },
  ) {
    if (client.role !== Role.RIDER) return;

    // Rate-limit: max 1 update per 4 seconds per order
    const key = `${client.userId}:${data.orderId}`;
    const last = this.lastLocationEmit.get(key) ?? 0;
    if (Date.now() - last < 4000) return;
    this.lastLocationEmit.set(key, Date.now());

    // Persist to Redis (60s TTL) — plan rule: GPS pings NOT in MongoDB
    await this.redis.setRiderLocation(client.userId, data.lat, data.lng);

    // Forward ONLY to that order's room (not to all customers)
    this.server.to(`order:${data.orderId}`).emit(SocketEvents.RIDER_LOCATION_UPDATE, {
      lat: data.lat,
      lng: data.lng,
      orderId: data.orderId,
    });
  }

  // ── Server-side emit helpers ──────────────────────────

  emitToRestaurant(event: string, data: unknown) {
    this.server.to('restaurant:main').emit(event, data);
  }

  emitToOrder(orderId: string, event: string, data: unknown) {
    this.server.to(`order:${orderId}`).emit(event, data);
  }

  emitToCustomer(customerId: string, event: string, data: unknown) {
    this.server.to(`user:${customerId}`).emit(event, data);
  }

  emitToAvailableRiders(event: string, data: unknown) {
    this.server.to('riders:available').emit(event, data);
  }
}
