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
      restaurantLat: parseFloat(process.env.RESTAURANT_LAT ?? '31.5204'),
      restaurantLng: parseFloat(process.env.RESTAURANT_LNG ?? '74.3587'),
    };
  }
}

@Module({ controllers: [AppConfigController] })
export class AppConfigModule {}
