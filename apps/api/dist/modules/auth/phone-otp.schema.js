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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneOtpSchema = exports.PhoneOtp = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let PhoneOtp = class PhoneOtp {
    phone;
    codeHash;
    attempts;
    lastSentAt;
    hourlyCount;
    expiresAt;
};
exports.PhoneOtp = PhoneOtp;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], PhoneOtp.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PhoneOtp.prototype, "codeHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PhoneOtp.prototype, "attempts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], PhoneOtp.prototype, "lastSentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], PhoneOtp.prototype, "hourlyCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: { expires: '0s' } }),
    __metadata("design:type", Date)
], PhoneOtp.prototype, "expiresAt", void 0);
exports.PhoneOtp = PhoneOtp = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PhoneOtp);
exports.PhoneOtpSchema = mongoose_1.SchemaFactory.createForClass(PhoneOtp);
exports.PhoneOtpSchema.index({ phone: 1, expiresAt: 1 });
//# sourceMappingURL=phone-otp.schema.js.map