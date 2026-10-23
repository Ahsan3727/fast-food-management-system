import { Controller, Post, Body, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsString, MinLength, MaxLength } from 'class-validator';

class LoginDto {
  @IsString() identifier: string; // phone or email
  @IsString() @MinLength(6) password: string;
}

class CustomerSessionDto {
  @IsString() @MinLength(2) @MaxLength(60) name: string;
  @IsString() @MinLength(7) @MaxLength(20) phone: string;
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
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.identifier, dto.password);
  }

  // ── Customer Direct Session (No password, No OTP code) ──
  @Post('customer-session')
  @HttpCode(HttpStatus.OK)
  async customerSession(@Body() dto: CustomerSessionDto) {
    return this.authService.customerSession(dto.name, dto.phone);
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
