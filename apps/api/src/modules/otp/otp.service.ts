import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import argon2 from 'argon2';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { Role } from '@fastfood/shared-types';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ── Send OTP ─────────────────────────────────────────────────
  /**
   * Generates a 6-digit OTP, hashes it with argon2, stores it in
   * Redis under `otp:<phone>` for 5 minutes, then sends via SMS.
   *
   * In development (NODE_ENV !== 'production') returns { code } in
   * the response for easy testing. Production returns {} (empty).
   */
  async sendOtp(phone: string): Promise<{ code?: string }> {
    const code = this.generateCode();
    const hash = await argon2.hash(code);

    // Store: TTL = 300 seconds (5 minutes)
    await this.redis.setex(`otp:${phone}`, 300, hash);

    const isDev = this.config.get<string>('NODE_ENV') !== 'production';

    if (!isDev) {
      // Production: send real SMS via provider injected here
      await this.sendSms(phone, `Your FastFood code is: ${code}. Valid for 5 minutes.`);
    } else {
      this.logger.debug(`[DEV] OTP for ${phone}: ${code}`);
    }

    return isDev ? { code } : {};
  }

  // ── Verify OTP ───────────────────────────────────────────────
  /**
   * Verifies the OTP against the Redis hash.
   * - If phone is new → creates a customer account (name required).
   * - If phone exists → authenticates the returning user.
   * Returns a JWT pair on success.
   */
  async verifyOtp(
    phone: string,
    code: string,
    name?: string,
  ): Promise<{ accessToken: string; refreshToken: string; isNewUser: boolean }> {
    const hash = await this.redis.get(`otp:${phone}`);
    if (!hash) throw new UnauthorizedException('OTP expired or not sent. Request a new code.');

    const valid = await argon2.verify(hash, code);
    if (!valid) throw new UnauthorizedException('Invalid OTP. Please try again.');

    // One-time use: delete immediately after successful verification
    await this.redis.del(`otp:${phone}`);

    let user = await this.usersService.findByPhone(phone);
    let isNewUser = false;

    if (!user) {
      // New customer — name is required on first sign-in
      if (!name || name.trim().length < 2) {
        throw new BadRequestException('Please enter your name (min 2 characters) to create your account.');
      }
      user = await this.usersService.create({
        name: name.trim(),
        phone,
        role: Role.CUSTOMER,
      });
      isNewUser = true;
    }

    if (user.isSuspended) {
      throw new ForbiddenException('Your account has been suspended. Please contact support.');
    }

    const tokens = await this.authService.issueTokens(
      user._id.toString(),
      user.role,
    );

    return { ...tokens, isNewUser };
  }

  // ── Helpers ──────────────────────────────────────────────────
  private generateCode(): string {
    // Cryptographically-adequate for a 6-digit OTP
    return Math.floor(100_000 + Math.random() * 900_000).toString();
  }

  // Swap this out for a real SMS provider in production
  private async sendSms(phone: string, message: string): Promise<void> {
    // TODO: integrate Twilio / Africa's Talking / EasyPaisa SMS
    this.logger.warn(`SMS stub — would send to ${phone}: "${message}"`);
  }
}
