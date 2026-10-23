import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsMobilePhone, Length, IsOptional, MinLength, MaxLength } from 'class-validator';
import { OtpService } from './otp.service';

class SendOtpDto {
  @IsMobilePhone()
  phone: string; // e.g. +923001234567
}

class VerifyOtpDto {
  @IsMobilePhone()
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;

  // Only required when the phone is new (first-time user)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;
}

@Controller('auth/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  /**
   * POST /auth/otp/send
   * Rate-limited: 3 requests per minute per IP.
   * Dev:  returns { code: "123456" }
   * Prod: returns {} (sends SMS)
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 60_000 } })
  async send(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto.phone);
  }

  /**
   * POST /auth/otp/verify
   * Rate-limited: 5 attempts per minute per IP.
   * Returns { accessToken, refreshToken, isNewUser }
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  async verify(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto.phone, dto.code, dto.name);
  }
}
