import { Module } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';
import { envFloat, envInt } from '../../common/env';

@Controller('app-config')
export class AppConfigController {
  @Get()
  getConfig() {
    return {
      minVersion: '1.0.0',
      currentVersion: '1.0.0',
      maintenanceMode: false,
      restaurantName: process.env.RESTAURANT_NAME ?? 'FastFood',
      restaurantPhone: process.env.RESTAURANT_PHONE ?? '+92 300 1234567',
      restaurantLat: envFloat(process.env.RESTAURANT_LAT, 31.5204),
      restaurantLng: envFloat(process.env.RESTAURANT_LNG, 74.3587),
      deliveryFeePaisa: envInt(process.env.DELIVERY_FEE_PAISA, 10000),
      freeDeliveryOverPaisa: envInt(process.env.FREE_DELIVERY_OVER_PAISA, 100000),
      maxDeliveryRadiusKm: envFloat(process.env.MAX_DELIVERY_RADIUS_KM, 25),
    };
  }
}

@Module({ controllers: [AppConfigController] })
export class AppConfigModule {}
