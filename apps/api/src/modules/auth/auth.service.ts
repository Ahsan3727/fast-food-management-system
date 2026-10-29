import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from './refresh-token.schema';
import { PhoneOtp, PhoneOtpDocument } from './phone-otp.schema';
import { Role } from '@fastfood/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(PhoneOtp.name)
    private phoneOtpModel: Model<PhoneOtpDocument>,
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

  // ── Customer Session (guest checkout — no password, no OTP code yet) ──
  // Phase 0 hardening: nothing proves the caller owns this phone number, so this
  // endpoint may only create or resume a plain, active CUSTOMER account. It never
  // issues a token for staff/rider/admin, and it never edits an existing account.
  // Phase 3 replaces it with phone OTP.
  async customerSession(name: string, phone: string) {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      throw new BadRequestException('Phone number is required');
    }

    let user = await this.usersService.findByPhone(cleanPhone);
    if (user) {
      // One message for every refusal, so the response does not reveal which
      // phone numbers belong to staff or suspended accounts.
      if (user.role !== Role.CUSTOMER || user.isSuspended) {
        throw new ForbiddenException('This phone number cannot be used for guest checkout');
      }
    } else {
      user = await this.usersService.create({
        name: name?.trim() || 'Customer',
        phone: cleanPhone,
        role: Role.CUSTOMER,
      });
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

  // ── Phone OTP: Request ──────────────────────────────────
  async requestOtp(phone: string) {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      throw new BadRequestException('A valid phone number is required');
    }

    const existingOtp = await this.phoneOtpModel.findOne({ phone: cleanPhone }).exec();
    const now = Date.now();

    if (existingOtp) {
      const msSinceLast = now - new Date(existingOtp.lastSentAt).getTime();
      if (msSinceLast < 60_000) {
        const remainingSec = Math.ceil((60_000 - msSinceLast) / 1000);
        throw new BadRequestException(`Please wait ${remainingSec} seconds before requesting a new code`);
      }

      // Max 5 OTPs per hour per phone
      if (existingOtp.hourlyCount >= 5) {
        throw new BadRequestException('Hourly OTP limit reached. Please try again later.');
      }
    }

    // Generate secure 6-digit code: 100000 to 999999
    const code = randomInt(100000, 1000000).toString();
    const codeHash = createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes

    const hourlyCount = existingOtp ? existingOtp.hourlyCount + 1 : 1;

    await this.phoneOtpModel.findOneAndUpdate(
      { phone: cleanPhone },
      {
        codeHash,
        attempts: 0,
        lastSentAt: new Date(now),
        hourlyCount,
        expiresAt,
      },
      { upsert: true, new: true },
    );

    // In development or until external SMS provider is attached, log code
    console.log(`[AUTH OTP] SMS verification code for ${cleanPhone}: ${code}`);

    return {
      success: true,
      message: 'Verification code sent',
      cooldownSeconds: 60,
    };
  }

  // ── Phone OTP: Verify ───────────────────────────────────
  async verifyOtp(phone: string, code: string, name?: string) {
    const cleanPhone = phone.trim();
    const cleanCode = code.trim();

    if (!cleanPhone || !cleanCode) {
      throw new BadRequestException('Phone number and verification code are required');
    }

    const otpRecord = await this.phoneOtpModel.findOne({ phone: cleanPhone }).exec();
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      if (otpRecord) await this.phoneOtpModel.deleteOne({ _id: otpRecord._id });
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    if (otpRecord.attempts >= 5) {
      await this.phoneOtpModel.deleteOne({ _id: otpRecord._id });
      throw new BadRequestException('Too many invalid attempts. Please request a new code.');
    }

    const inputHash = createHash('sha256').update(cleanCode).digest('hex');
    if (inputHash !== otpRecord.codeHash) {
      await this.phoneOtpModel.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      const remaining = 5 - (otpRecord.attempts + 1);
      throw new BadRequestException(
        remaining > 0
          ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many invalid attempts. Please request a new code.'
      );
    }

    // Code matches! Clear the OTP record
    await this.phoneOtpModel.deleteOne({ _id: otpRecord._id });

    // Find or create customer user
    let user = await this.usersService.findByPhone(cleanPhone);
    if (user) {
      if (user.role !== Role.CUSTOMER || user.isSuspended) {
        throw new ForbiddenException('This phone number cannot be used for customer checkout');
      }
    } else {
      user = await this.usersService.create({
        name: name?.trim() || 'Customer',
        phone: cleanPhone,
        role: Role.CUSTOMER,
      });
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
