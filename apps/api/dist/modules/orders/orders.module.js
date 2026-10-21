"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const order_schema_1 = require("./order.schema");
const orders_service_1 = require("./orders.service");
const orders_controller_1 = require("./orders.controller");
const menu_module_1 = require("../menu/menu.module");
const notifications_module_1 = require("../notifications/notifications.module");
const realtime_module_1 = require("../../realtime/realtime.module");
const users_module_1 = require("../users/users.module");
const riders_module_1 = require("../riders/riders.module");
const rider_dispatch_processor_1 = require("../../jobs/rider-dispatch.processor");
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: order_schema_1.Order.name, schema: order_schema_1.OrderSchema }]),
            menu_module_1.MenuModule,
            notifications_module_1.NotificationsModule,
            realtime_module_1.RealtimeModule,
            users_module_1.UsersModule,
            riders_module_1.RidersModule,
            // BullMQ queue — Optional: if Redis isn't available the @Optional() in service prevents crash
            bullmq_1.BullModule.registerQueue({ name: rider_dispatch_processor_1.RIDER_DISPATCH_QUEUE }),
        ],
        providers: [orders_service_1.OrdersService],
        controllers: [orders_controller_1.OrdersController],
        exports: [orders_service_1.OrdersService],
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map