import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private client;
    constructor(config: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    get isReady(): boolean;
    getClient(): Redis | null;
    setRiderLocation(riderId: string, lat: number, lng: number): Promise<void>;
    getRiderLocation(riderId: string): Promise<{
        lat: number;
        lng: number;
        ts: number;
    } | null>;
    deleteRiderLocation(riderId: string): Promise<void>;
    get(key: string): Promise<string | null>;
    setex(key: string, ttlSeconds: number, value: string): Promise<void>;
    del(key: string): Promise<void>;
    incr(key: string): Promise<number>;
}
//# sourceMappingURL=redis.service.d.ts.map