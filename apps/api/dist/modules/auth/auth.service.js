"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const argon2_1 = __importDefault(require("argon2"));
const uuid_1 = require("uuid");
const users_service_1 = require("../users/users.service");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const refresh_token_schema_1 = require("./refresh-token.schema");
const phone_otp_schema_1 = require("./phone-otp.schema");
const shared_types_1 = require("@fastfood/shared-types");
let AuthService = class AuthService {
    usersService;
    jwtService;
    config;
    refreshTokenModel;
    phoneOtpModel;
    constructor(usersService, jwtService, config, refreshTokenModel, phoneOtpModel) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
        this.refreshTokenModel = refreshTokenModel;
        this.phoneOtpModel = phoneOtpModel;
    }
    // ── Register (Staff / General) ──────────────────────────
    async register(name, phone, password, email) {
        const existing = await this.usersService.findByPhone(phone);
        if (existing)
            throw new common_1.BadRequestException('Phone already registered');
        const hash = await argon2_1.default.hash(password);
        const user = await this.usersService.create({
            name,
            phone,
            email,
            password: hash,
            role: shared_types_1.Role.CUSTOMER,
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
    async login(identifier, password) {
        const user = identifier.includes('@')
            ? await this.usersService.findByEmail(identifier)
            : await this.usersService.findByPhone(identifier);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (user.isSuspended)
            throw new common_1.ForbiddenException('Account suspended');
        if (!user.password)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await argon2_1.default.verify(user.password, password);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async customerSession(name, phone) {
        const cleanPhone = phone.trim();
        if (!cleanPhone) {
            throw new common_1.BadRequestException('Phone number is required');
        }
        let user = await this.usersService.findByPhone(cleanPhone);
        if (user) {
            // One message for every refusal, so the response does not reveal which
            // phone numbers belong to staff or suspended accounts.
            if (user.role !== shared_types_1.Role.CUSTOMER || user.isSuspended) {
                throw new common_1.ForbiddenException('This phone number cannot be used for guest checkout');
            }
        }
        else {
            user = await this.usersService.create({
                name: name?.trim() || 'Customer',
                phone: cleanPhone,
                role: shared_types_1.Role.CUSTOMER,
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
    async requestOtp(phone) {
        const cleanPhone = phone.trim();
        if (!cleanPhone || cleanPhone.length < 7) {
            throw new common_1.BadRequestException('A valid phone number is required');
        }
        const existingOtp = await this.phoneOtpModel.findOne({ phone: cleanPhone }).exec();
        const now = Date.now();
        if (existingOtp) {
            const msSinceLast = now - new Date(existingOtp.lastSentAt).getTime();
            if (msSinceLast < 60_000) {
                const remainingSec = Math.ceil((60_000 - msSinceLast) / 1000);
                throw new common_1.BadRequestException(`Please wait ${remainingSec} seconds before requesting a new code`);
            }
            // Max 5 OTPs per hour per phone
            if (existingOtp.hourlyCount >= 5) {
                throw new common_1.BadRequestException('Hourly OTP limit reached. Please try again later.');
            }
        }
        // Generate secure 6-digit code: 100000 to 999999
        const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
        const codeHash = (0, crypto_1.createHash)('sha256').update(code).digest('hex');
        const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes
        const hourlyCount = existingOtp ? existingOtp.hourlyCount + 1 : 1;
        await this.phoneOtpModel.findOneAndUpdate({ phone: cleanPhone }, {
            codeHash,
            attempts: 0,
            lastSentAt: new Date(now),
            hourlyCount,
            expiresAt,
        }, { upsert: true, new: true });
        // In development or until external SMS provider is attached, log code
        console.log(`[AUTH OTP] SMS verification code for ${cleanPhone}: ${code}`);
        return {
            success: true,
            message: 'Verification code sent',
            cooldownSeconds: 60,
        };
    }
    // ── Phone OTP: Verify ───────────────────────────────────
    async verifyOtp(phone, code, name) {
        const cleanPhone = phone.trim();
        const cleanCode = code.trim();
        if (!cleanPhone || !cleanCode) {
            throw new common_1.BadRequestException('Phone number and verification code are required');
        }
        const otpRecord = await this.phoneOtpModel.findOne({ phone: cleanPhone }).exec();
        if (!otpRecord || otpRecord.expiresAt < new Date()) {
            if (otpRecord)
                await this.phoneOtpModel.deleteOne({ _id: otpRecord._id });
            throw new common_1.BadRequestException('Verification code has expired. Please request a new code.');
        }
        if (otpRecord.attempts >= 5) {
            await this.phoneOtpModel.deleteOne({ _id: otpRecord._id });
            throw new common_1.BadRequestException('Too many invalid attempts. Please request a new code.');
        }
        const inputHash = (0, crypto_1.createHash)('sha256').update(cleanCode).digest('hex');
        if (inputHash !== otpRecord.codeHash) {
            await this.phoneOtpModel.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
            const remaining = 5 - (otpRecord.attempts + 1);
            throw new common_1.BadRequestException(remaining > 0
                ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
                : 'Too many invalid attempts. Please request a new code.');
        }
        // Code matches! Clear the OTP record
        await this.phoneOtpModel.deleteOne({ _id: otpRecord._id });
        // Find or create customer user
        let user = await this.usersService.findByPhone(cleanPhone);
        if (user) {
            if (user.role !== shared_types_1.Role.CUSTOMER || user.isSuspended) {
                throw new common_1.ForbiddenException('This phone number cannot be used for customer checkout');
            }
        }
        else {
            user = await this.usersService.create({
                name: name?.trim() || 'Customer',
                phone: cleanPhone,
                role: shared_types_1.Role.CUSTOMER,
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
    async refresh(oldToken) {
        const record = await this.refreshTokenModel
            .findOne({ tokenHash: this.hashToken(oldToken) })
            .exec();
        if (!record) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (record.expiresAt < new Date()) {
            await this.refreshTokenModel.deleteOne({ _id: record._id });
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        // Delete old token (rotation)
        await this.refreshTokenModel.deleteOne({ _id: record._id });
        const user = await this.usersService.findById(record.userId);
        return this.issueTokens(user._id.toString(), user.role);
    }
    // ── Logout ─────────────────────────────────────────────
    async logout(userId) {
        await this.refreshTokenModel.deleteMany({ userId }).exec();
    }
    // ── Helpers ────────────────────────────────────────────
    async issueTokens(userId, role) {
        const payload = { sub: userId, role };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: this.config.get('JWT_EXPIRES_IN'),
        });
        const refreshToken = (0, uuid_1.v4)();
        const hash = this.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await new this.refreshTokenModel({ userId, tokenHash: hash, expiresAt }).save();
        return { accessToken, refreshToken };
    }
    // Use fast SHA-256 for refresh token hashing (not argon2 — that's for passwords)
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, mongoose_1.InjectModel)(refresh_token_schema_1.RefreshToken.name)),
    __param(4, (0, mongoose_1.InjectModel)(phone_otp_schema_1.PhoneOtp.name)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map