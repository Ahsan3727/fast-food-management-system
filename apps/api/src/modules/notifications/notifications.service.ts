import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const serviceAccountJson = this.config.get<string>('FCM_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      this.logger.warn('FCM_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
      return;
    }
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      }
      this.initialized = true;
      this.logger.log('Firebase Admin initialized — FCM ready');
    } catch (e: any) {
      this.logger.error(`Firebase init failed: ${e.message}`);
    }
  }

  // ── Send to a single device token ───────────────────────
  async sendToToken(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.initialized || !fcmToken) return;
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data: data ?? {},
        android: {
          priority: 'high',
          notification: { channelId: 'fastfood_orders', sound: 'default' },
        },
      });
    } catch (e: any) {
      this.logger.warn(`FCM send failed for token ${fcmToken.slice(0, 10)}…: ${e.message}`);
    }
  }

  // ── Send to multiple tokens (batch) ─────────────────────
  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.initialized || !tokens.length) return;
    const chunks = this.chunk(tokens, 500); // FCM max per batch
    for (const chunk of chunks) {
      try {
        await admin.messaging().sendEachForMulticast({
          tokens: chunk,
          notification: { title, body },
          data: data ?? {},
          android: { priority: 'high', notification: { channelId: 'fastfood_orders', sound: 'default' } },
        });
      } catch (e: any) {
        this.logger.warn(`FCM multicast failed: ${e.message}`);
      }
    }
  }

  // ── Convenience: notify rider of delivery request ────────
  async notifyRiderDeliveryRequest(
    fcmToken: string,
    orderNumber: string,
    orderId: string,
  ): Promise<void> {
    await this.sendToToken(
      fcmToken,
      '🏍️ New Delivery Request',
      `Order #${orderNumber} is ready for pickup`,
      { type: 'DELIVERY_REQUEST', orderId },
    );
  }

  // ── Convenience: notify customer of order status ─────────
  async notifyCustomerOrderStatus(
    fcmToken: string,
    orderNumber: string,
    status: string,
    orderId: string,
  ): Promise<void> {
    const messages: Record<string, string> = {
      ACCEPTED:      '✅ Your order has been accepted!',
      PREPARING:     '👨‍🍳 Your order is being prepared',
      READY:         '🔔 Your order is ready for pickup',
      RIDER_ASSIGNED:'🏍️ A rider is on their way',
      PICKED_UP:     '📦 Your order is on the way!',
      DELIVERED:     '🎉 Your order has been delivered!',
      CANCELLED:     '❌ Your order was cancelled',
      REJECTED:      '❌ Your order was rejected',
    };
    const body = messages[status] ?? `Order status: ${status}`;
    await this.sendToToken(fcmToken, `Order #${orderNumber}`, body, { type: 'ORDER_STATUS', orderId, status });
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  }
}
