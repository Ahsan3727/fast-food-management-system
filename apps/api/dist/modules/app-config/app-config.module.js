"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigModule = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
let AppConfigController = class AppConfigController {
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
};
__decorate([
    (0, common_2.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppConfigController.prototype, "getConfig", null);
AppConfigController = __decorate([
    (0, common_2.Controller)('app-config')
], AppConfigController);
let AppConfigModule = class AppConfigModule {
};
exports.AppConfigModule = AppConfigModule;
exports.AppConfigModule = AppConfigModule = __decorate([
    (0, common_1.Module)({ controllers: [AppConfigController] })
], AppConfigModule);
//# sourceMappingURL=app-config.module.js.map