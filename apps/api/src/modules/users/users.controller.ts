import { Controller, Get, Patch, Body, UseGuards, Request, Post, Query, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@fastfood/shared-types';
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

  // ── Admin: list users by role (riders, customers, staff) ────────
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  async listUsers(
    @Query('role') role?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const users = await this.usersService.listAll(role, +page, +limit);
    return { users };
  }

  // ── Admin: suspend or activate user ─────────────────────────────
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isSuspended?: boolean },
  ) {
    if (body.isSuspended === true) {
      await this.usersService.suspendUser(id);
    } else if (body.isSuspended === false) {
      await this.usersService.activateUser(id);
    }
    const user = await this.usersService.findById(id);
    return { user };
  }
}
