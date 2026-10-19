import { Controller, Get, Patch, Body, UseGuards, Request, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto, UpdateAddressDto } from './users.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    const { password: _pw, ...safe } = user.toObject();
    return { user: safe };
  }

  @Patch('me')
  async updateMe(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.sub, dto);
    return { user };
  }

  @Post('me/address')
  async updateAddress(@Request() req: any, @Body() dto: UpdateAddressDto) {
    const user = await this.usersService.updateAddress(req.user.sub, dto);
    return { user };
  }

  @Post('me/fcm-token')
  async updateFcmToken(@Request() req: any, @Body() body: { fcmToken: string }) {
    await this.usersService.saveFcmToken(req.user.sub, body.fcmToken);
    return { ok: true };
  }
}
