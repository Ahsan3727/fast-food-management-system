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
const shared_types_1 = require("@fastfood/shared-types");
let AuthService = class AuthService {
    usersService;
    jwtService;
    config;
    refreshTokenModel;
    constructor(usersService, jwtService, config, refreshTokenModel) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
        this.refreshTokenModel = refreshTokenModel;
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
    // ── Customer Session (Direct checkout / profile — No password, No OTP code) ──
    async customerSession(name, phone) {
        const cleanPhone = phone.trim();
        if (!cleanPhone) {
            throw new common_1.BadRequestException('Phone number is required');
        }
        let user = await this.usersService.findByPhone(cleanPhone);
        if (!user) {
            user = await this.usersService.create({
                name: name?.trim() || 'Customer',
                phone: cleanPhone,
                role: shared_types_1.Role.CUSTOMER,
            });
        }
        else if (name && name.trim() && user.name !== name.trim()) {
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
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map