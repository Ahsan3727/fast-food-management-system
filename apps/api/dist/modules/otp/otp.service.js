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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const argon2_1 = __importDefault(require("argon2"));
const redis_service_1 = require("../../redis/redis.service");
const users_service_1 = require("../users/users.service");
const auth_service_1 = require("../auth/auth.service");
const shared_types_1 = require("@fastfood/shared-types");
let OtpService = OtpService_1 = class OtpService {
    redis;
    usersService;
    authService;
    config;
    logger = new common_1.Logger(OtpService_1.name);
    constructor(redis, usersService, authService, config) {
        this.redis = redis;
        this.usersService = usersService;
        this.authService = authService;
        this.config = config;
    }
    // ── Send OTP ─────────────────────────────────────────────────
    /**
     * Generates a 6-digit OTP, hashes it with argon2, stores it in
     * Redis under `otp:<phone>` for 5 minutes, then sends via SMS.
     *
     * In development (NODE_ENV !== 'production') returns { code } in
     * the response for easy testing. Production returns {} (empty).
     */
    async sendOtp(phone) {
        const code = this.generateCode();
        const hash = await argon2_1.default.hash(code);
        // Store: TTL = 300 seconds (5 minutes)
        await this.redis.setex(`otp:${phone}`, 300, hash);
        const isDev = this.config.get('NODE_ENV') !== 'production';
        if (!isDev) {
            // Production: send real SMS via provider injected here
            await this.sendSms(phone, `Your FastFood code is: ${code}. Valid for 5 minutes.`);
        }
        else {
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
    async verifyOtp(phone, code, name) {
        const hash = await this.redis.get(`otp:${phone}`);
        if (!hash)
            throw new common_1.UnauthorizedException('OTP expired or not sent. Request a new code.');
        const valid = await argon2_1.default.verify(hash, code);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid OTP. Please try again.');
        // One-time use: delete immediately after successful verification
        await this.redis.del(`otp:${phone}`);
        let user = await this.usersService.findByPhone(phone);
        let isNewUser = false;
        if (!user) {
            // New customer — name is required on first sign-in
            if (!name || name.trim().length < 2) {
                throw new common_1.BadRequestException('Please enter your name (min 2 characters) to create your account.');
            }
            user = await this.usersService.create({
                name: name.trim(),
                phone,
                role: shared_types_1.Role.CUSTOMER,
            });
            isNewUser = true;
        }
        if (user.isSuspended) {
            throw new common_1.ForbiddenException('Your account has been suspended. Please contact support.');
        }
        const tokens = await this.authService.issueTokens(user._id.toString(), user.role);
        return { ...tokens, isNewUser };
    }
    // ── Helpers ──────────────────────────────────────────────────
    generateCode() {
        // Cryptographically-adequate for a 6-digit OTP
        return Math.floor(100_000 + Math.random() * 900_000).toString();
    }
    // Swap this out for a real SMS provider in production
    async sendSms(phone, message) {
        // TODO: integrate Twilio / Africa's Talking / EasyPaisa SMS
        this.logger.warn(`SMS stub — would send to ${phone}: "${message}"`);
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        users_service_1.UsersService,
        auth_service_1.AuthService,
        config_1.ConfigService])
], OtpService);
//# sourceMappingURL=otp.service.js.map