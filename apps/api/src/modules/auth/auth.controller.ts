import { Controller, Post, Body, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

class LoginDto {
  @IsString() identifier: string; // phone or email
  @IsString() @MinLength(6) password: string;
}

class CustomerSessionDto {
  @IsString() @MinLength(2) @MaxLength(60) name: string;
  @IsString() @MinLength(7) @MaxLength(20) phone: string;
}

class RequestOtpDto {
  @IsString() @MinLength(7) @MaxLength(20) phone: string;
}

class VerifyOtpDto {
  @IsString() @MinLength(7) @MaxLength(20) phone: string;
  @IsString() @MinLength(4) @MaxLength(10) code: string;
  @IsOptional() @IsString() @MaxLength(60) name?: string;
}

class RefreshDto {
  @IsString() refreshToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Admin / Rider login with password ────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.identifier, dto.password);
  }

  // ── Customer Direct Session (Legacy fallback) ──────────
  @Post('customer-session')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async customerSession(@Body() dto: CustomerSessionDto) {
    return this.authService.customerSession(dto.name, dto.phone);
  }

  // ── Phone OTP endpoints (Phase 3 Guest Identity) ────────
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code, dto.name);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.sub);
  }
}
