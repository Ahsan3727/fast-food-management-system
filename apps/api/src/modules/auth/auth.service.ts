import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from './refresh-token.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  // ── Refresh Token Rotation ─────────────────────────────
  async refresh(oldToken: string) {
    const record = await this.refreshTokenModel
      .findOne({ tokenHash: this.hashToken(oldToken) })
      .exec();

    if (!record) {
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
    await this.refreshTokenModel.deleteMany({ userId }).exec();
  }

  // ── Helpers ────────────────────────────────────────────
  async issueTokens(userId: string, role: string) {
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
