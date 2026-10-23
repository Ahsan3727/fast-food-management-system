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

  // ── Register (Staff / General) ──────────────────────────
  async register(name: string, phone: string, password: string, email?: string) {
    const existing = await this.usersService.findByPhone(phone);
    if (existing) throw new BadRequestException('Phone already registered');

    const hash = await argon2.hash(password);
    const user = await this.usersService.create({
      name,
      phone,
      email,
      password: hash,
      role: Role.CUSTOMER,
    });

    const tokens = await this.issueTokens(user._id.toString(), user.role);
    return {
      ...tokens,
      user: {
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ── Login (Staff / Rider / Admin with password) ────────
  async login(identifier: string, password: string) {
    const user =
      identifier.includes('@')
        ? await this.usersService.findByEmail(identifier)
        : await this.usersService.findByPhone(identifier);

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.isSuspended) throw new ForbiddenException('Account suspended');
    if (!user.password) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user._id.toString(), user.role);
    return {
      ...tokens,
      user: {
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ── Customer Session (Direct checkout / profile — No password, No OTP code) ──
  async customerSession(name: string, phone: string) {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      throw new BadRequestException('Phone number is required');
    }

    let user = await this.usersService.findByPhone(cleanPhone);
    if (!user) {
      user = await this.usersService.create({
        name: name?.trim() || 'Customer',
        phone: cleanPhone,
        role: Role.CUSTOMER,
      });
    } else if (name && name.trim() && user.name !== name.trim()) {
      await this.usersService.updateProfile(user._id.toString(), { name: name.trim() });
      user.name = name.trim();
    }

    const tokens = await this.issueTokens(user._id.toString(), user.role);
    return {
      ...tokens,
      user: {
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    };
  }

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
