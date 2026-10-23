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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const class_validator_1 = require("class-validator");
const otp_service_1 = require("./otp.service");
class SendOtpDto {
    phone; // e.g. +923001234567
}
__decorate([
    (0, class_validator_1.IsMobilePhone)(),
    __metadata("design:type", String)
], SendOtpDto.prototype, "phone", void 0);
class VerifyOtpDto {
    phone;
    code;
    // Only required when the phone is new (first-time user)
    name;
}
__decorate([
    (0, class_validator_1.IsMobilePhone)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "name", void 0);
let OtpController = class OtpController {
    otpService;
    constructor(otpService) {
        this.otpService = otpService;
    }
    /**
     * POST /auth/otp/send
     * Rate-limited: 3 requests per minute per IP.
     * Dev:  returns { code: "123456" }
     * Prod: returns {} (sends SMS)
     */
    async send(dto) {
        return this.otpService.sendOtp(dto.phone);
    }
    /**
     * POST /auth/otp/verify
     * Rate-limited: 5 attempts per minute per IP.
     * Returns { accessToken, refreshToken, isNewUser }
     */
    async verify(dto) {
        return this.otpService.verifyOtp(dto.phone, dto.code, dto.name);
    }
};
exports.OtpController = OtpController;
__decorate([
    (0, common_1.Post)('send'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ short: { limit: 3, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendOtpDto]),
    __metadata("design:returntype", Promise)
], OtpController.prototype, "send", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ short: { limit: 5, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], OtpController.prototype, "verify", null);
exports.OtpController = OtpController = __decorate([
    (0, common_1.Controller)('auth/otp'),
    __metadata("design:paramtypes", [otp_service_1.OtpService])
], OtpController);
//# sourceMappingURL=otp.controller.js.map