import { Module } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';

@Controller('app-config')
class AppConfigController {
  @Get()
  getConfig() {
    return {
      minVersion: '1.0.0',
      currentVersion: '1.0.0',
      maintenanceMode: false,
      restaurantName: process.env.RESTAURANT_NAME ?? 'FastFood',
      restaurantPhone: process.env.RESTAURANT_PHONE ?? '+92 300 1234567',
      restaurantLat: parseFloat(process.env.RESTAURANT_LAT ?? '31.5204'),
      restaurantLng: parseFloat(process.env.RESTAURANT_LNG ?? '74.3587'),
      deliveryFeePaisa: parseInt(process.env.DELIVERY_FEE_PAISA ?? '10000', 10),
      freeDeliveryOverPaisa: parseInt(process.env.FREE_DELIVERY_OVER_PAISA ?? '100000', 10),
      maxDeliveryRadiusKm: parseFloat(process.env.MAX_DELIVERY_RADIUS_KM ?? '25'),
    };
  }
}

@Module({ controllers: [AppConfigController] })
export class AppConfigModule {}
