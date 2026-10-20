import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@fastfood/shared-types';
import { RedisService } from '../redis/redis.service';
interface AuthenticatedSocket extends Socket {
    userId: string;
    role: Role;
}
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private config;
    private redis;
    server: Server;
    private readonly logger;
    private lastLocationEmit;
    constructor(jwtService: JwtService, config: ConfigService, redis: RedisService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinOrder(client: AuthenticatedSocket, data: {
        orderId: string;
    }): Promise<void>;
    handleRiderLocation(client: AuthenticatedSocket, data: {
        orderId: string;
        lat: number;
        lng: number;
    }): Promise<void>;
    emitToRestaurant(event: string, data: unknown): void;
    emitToOrder(orderId: string, event: string, data: unknown): void;
    emitToCustomer(customerId: string, event: string, data: unknown): void;
    emitToAvailableRiders(event: string, data: unknown): void;
}
export {};
//# sourceMappingURL=realtime.gateway.d.ts.map