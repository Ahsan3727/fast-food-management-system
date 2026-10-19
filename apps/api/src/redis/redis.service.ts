import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL not set — Redis features disabled');
      return;
    }
    this.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 3 });
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (e) => this.logger.error(`Redis error: ${e.message}`));
    this.client.connect().catch(() => {/* handled by error event */});
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }

  get isReady(): boolean {
    return !!this.client && this.client.status === 'ready';
  }

  getClient(): Redis | null {
    return this.client ?? null;
  }

  // ── Rider location (live GPS, not MongoDB) ───────────────
  async setRiderLocation(riderId: string, lat: number, lng: number): Promise<void> {
    if (!this.isReady) return;
    await this.client.setex(
      `rider:loc:${riderId}`,
      60,                              // expires 60 s → stale rider marker disappears
      JSON.stringify({ lat, lng, ts: Date.now() }),
    );
  }

  async getRiderLocation(riderId: string): Promise<{ lat: number; lng: number; ts: number } | null> {
    if (!this.isReady) return null;
    const raw = await this.client.get(`rider:loc:${riderId}`);
    return raw ? JSON.parse(raw) : null;
  }

  async deleteRiderLocation(riderId: string): Promise<void> {
    if (!this.isReady) return;
    await this.client.del(`rider:loc:${riderId}`);
  }

  // ── Generic helpers ──────────────────────────────────────
  async get(key: string): Promise<string | null> {
    if (!this.isReady) return null;
    return this.client.get(key);
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    if (!this.isReady) return;
    await this.client.setex(key, ttlSeconds, value);
  }

  async del(key: string): Promise<void> {
    if (!this.isReady) return;
    await this.client.del(key);
  }

  async incr(key: string): Promise<number> {
    if (!this.isReady) return 0;
    return this.client.incr(key);
  }
}
