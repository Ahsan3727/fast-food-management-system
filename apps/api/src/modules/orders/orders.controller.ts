import {
  Controller, Post, Get, Patch, Body, Param, Query,
  UseGuards, Request, Headers, HttpCode, HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderStatus, Role } from '@fastfood/shared-types';
import { IsString, IsNumber, IsOptional, IsArray, IsObject } from 'class-validator';

class CreateOrderDto {
  @IsArray() items: any[];
  @IsObject() deliveryAddress: any;
  @IsObject() payment: any;
  @IsOptional() @IsString() notes?: string;
}

class TransitionDto {
  @IsString() status: OrderStatus;
  @IsOptional() @IsString() note?: string;
}

class DeliverDto {
  @IsString() otp: string;
  @IsNumber() cashCollectedPaisa: number;
}

class CancelDto {
  @IsString() reason: string;
}

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── Customer: place order ─────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOrder(
    @Request() req: any,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.ordersService.create(req.user.sub, { ...dto, idempotencyKey });
  }

  // ── Customer: list my orders ──────────────────────────
  @Get('my')
  listMyOrders(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.ordersService.listForCustomer(req.user.sub, +page, +limit);
  }

  // ── Customer: get delivery OTP (tracking screen only) ─
  @Get(':id/otp')
  getOtp(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.getOtpForCustomer(id, req.user.sub);
  }

  // ── Customer: cancel ──────────────────────────────────
  @Post(':id/cancel')
  cancelOrder(@Request() req: any, @Param('id') id: string, @Body() dto: CancelDto) {
    return this.ordersService.cancel(id, req.user.sub, dto.reason);
  }

  // ── Rider: available orders ───────────────────────────
  @Get('available')
  @UseGuards(RolesGuard)
  @Roles(Role.RIDER)
  getAvailable() {
    return this.ordersService.getAvailableOrders();
  }

  // ── Rider: accept (atomic) ────────────────────────────
  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(Role.RIDER)
  acceptOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.riderAccept(id, req.user.sub);
  }

  // ── Rider: active order ───────────────────────────────
  @Get('rider/active')
  @UseGuards(RolesGuard)
  @Roles(Role.RIDER)
  getActiveOrder(@Request() req: any) {
    return this.ordersService.getRiderActiveOrder(req.user.sub);
  }

  // ── Rider: deliver with OTP ───────────────────────────
  @Post(':id/deliver')
  @UseGuards(RolesGuard)
  @Roles(Role.RIDER)
  deliver(@Request() req: any, @Param('id') id: string, @Body() dto: DeliverDto) {
    return this.ordersService.verifyOtpAndDeliver(id, req.user.sub, dto.otp, dto.cashCollectedPaisa);
  }

  // ── Admin / Staff: all orders ─────────────────────────
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  listAll(@Query('status') status?: OrderStatus, @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.ordersService.listAll(status, +page, +limit);
  }

  // ── Admin / Staff: transition status ─────────────────
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.RIDER)
  transition(@Request() req: any, @Param('id') id: string, @Body() dto: TransitionDto) {
    return this.ordersService.transition(id, dto.status, req.user.sub, req.user.role as Role, dto.note);
  }

  // ── Admin / Staff: analytics summary ─────────────────
  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  getAnalytics(@Query('days') days = 30) {
    return this.ordersService.getAnalytics(+days);
  }

  // ── Any authenticated: get by ID ──────────────────────
  @Get(':id')
  getById(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.getById(id, req.user.sub, req.user.role as Role);
  }
}
