import { Module, Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@fastfood/shared-types';

// ── Rider Schema ────────────────────────────
export type RiderDocument = Rider & Document;

@Schema({ timestamps: true })
export class Rider {
  @Prop({ required: true }) userId: string; // links to users collection
  @Prop({ default: false }) isOnline: boolean;
  @Prop({ default: 0 }) totalDeliveries: number;
  @Prop({ default: 0 }) unsettledCashPaisa: number; // integer paisa
}

export const RiderSchema = SchemaFactory.createForClass(Rider);
RiderSchema.index({ userId: 1 }, { unique: true });

// ── Rider Service ────────────────────────────
@Injectable()
class RidersService {
  constructor(@InjectModel(Rider.name) private riderModel: Model<RiderDocument>) {}

  async setOnlineStatus(userId: string, isOnline: boolean) {
    return this.riderModel.findOneAndUpdate(
      { userId },
      { $set: { isOnline } },
      { upsert: true, new: true },
    );
  }

  async getDashboard(userId: string) {
    const rider = await this.riderModel.findOne({ userId }).lean();
    return {
      isOnline: rider?.isOnline ?? false,
      unsettledCashPaisa: rider?.unsettledCashPaisa ?? 0,
      totalDeliveries: rider?.totalDeliveries ?? 0,
    };
  }

  async addUnsettledCash(userId: string, amountPaisa: number) {
    await this.riderModel.findOneAndUpdate(
      { userId },
      { $inc: { unsettledCashPaisa: amountPaisa, totalDeliveries: 1 } },
      { upsert: true },
    );
  }

  async settleRider(userId: string) {
    await this.riderModel.findOneAndUpdate(
      { userId },
      { $set: { unsettledCashPaisa: 0 } },
    );
  }
}

// ── Rider Controller ─────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('riders')
class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles(Role.RIDER)
  getDashboard(@Request() req: any) {
    return this.ridersService.getDashboard(req.user.sub);
  }

  @Post('status')
  @UseGuards(RolesGuard)
  @Roles(Role.RIDER)
  setStatus(@Request() req: any, @Body() body: { isOnline: boolean }) {
    return this.ridersService.setOnlineStatus(req.user.sub, body.isOnline);
  }

  @Post(':userId/settle')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  settleRider(@Param('userId') userId: string) {
    return this.ridersService.settleRider(userId);
  }
}

// ── Riders Module ─────────────────────────────
@Module({
  imports: [MongooseModule.forFeature([{ name: Rider.name, schema: RiderSchema }])],
  providers: [RidersService],
  controllers: [RidersController],
  exports: [RidersService],
})
export class RidersModule {}
