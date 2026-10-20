import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class NotificationsService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private initialized;
    constructor(config: ConfigService);
    onModuleInit(): void;
    sendToToken(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
    sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void>;
    notifyRiderDeliveryRequest(fcmToken: string, orderNumber: string, orderId: string): Promise<void>;
    notifyCustomerOrderStatus(fcmToken: string, orderNumber: string, status: string, orderId: string): Promise<void>;
    private chunk;
}
//# sourceMappingURL=notifications.service.d.ts.map