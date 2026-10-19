import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from './refresh-token.schema';
import { Role } from '@fastfood/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  // ── Register (Customer) ────────────────────────────────
  async register(name: string, phone: string, password: string, email?: string) {
    const existing = await this.usersService.findByPhone(phone);
    if (existing) throw new BadRequestException('Phone already registered');

    const hash = await argon2.hash(password);
    // Role is ALWAYS set server-side — never from the client
    const user = await this.usersService.create({
      name,
      phone,
      email,
      password: hash,
      role: Role.CUSTOMER,
    });

    return this.issueTokens(user._id.toString(), user.role);
  }

  // ── Login ──────────────────────────────────────────────
  async login(identifier: string, password: string) {
    const user =
      identifier.includes('@')
        ? await this.usersService.findByEmail(identifier)
        : await this.usersService.findByPhone(identifier);

    // Generic error — never reveal whether account exists
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.isSuspended) throw new ForbiddenException('Account suspended');
    if (!user.password) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user._id.toString(), user.role);
  }

  // ── Refresh Token Rotation ─────────────────────────────
  async refresh(oldToken: string) {
    const record = await this.refreshTokenModel
      .findOne({ tokenHash: this.hashToken(oldToken) })
      .exec();

    if (!record) {
      // Possible reuse — revoke all tokens for this user
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.expiresAt < new Date()) {
      await this.refreshTokenModel.deleteOne({ _id: record._id });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Delete old token (rotation)
    await this.refreshTokenModel.deleteOne({ _id: record._id });

    const user = await this.usersService.findById(record.userId);
    return this.issueTokens(user._id.toString(), user.role);
  }

  // ── Logout ─────────────────────────────────────────────
  async logout(userId: string) {
    // Revoke all refresh tokens for this user
    await this.refreshTokenModel.deleteMany({ userId }).exec();
    // FCM token is cleared by the client calling DELETE /v1/users/me/fcm-token
  }

  // ── Helpers ────────────────────────────────────────────
  private async issueTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
    });

    const refreshToken = uuidv4();
    const hash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await new this.refreshTokenModel({ userId, tokenHash: hash, expiresAt }).save();

    return { accessToken, refreshToken };
  }

  // Use fast SHA-256 for refresh token hashing (not argon2 — that's for passwords)
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
