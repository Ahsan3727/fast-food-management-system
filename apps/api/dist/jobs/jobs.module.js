"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const rider_dispatch_processor_1 = require("./rider-dispatch.processor");
const order_schema_1 = require("../modules/orders/order.schema");
const realtime_module_1 = require("../realtime/realtime.module");
const notifications_module_1 = require("../modules/notifications/notifications.module");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (cfg) => {
                    const redisUrl = cfg.get('REDIS_URL');
                    if (!redisUrl) {
                        return {
                            connection: {
                                host: 'localhost', port: 6379,
                                lazyConnect: true, enableOfflineQueue: false,
                                maxRetriesPerRequest: 0,
                                retryStrategy: () => null,
                            },
                        };
                    }
                    return { connection: { url: redisUrl } };
                },
                inject: [config_1.ConfigService],
            }),
            bullmq_1.BullModule.registerQueue({ name: rider_dispatch_processor_1.RIDER_DISPATCH_QUEUE }),
            mongoose_1.MongooseModule.forFeature([{ name: order_schema_1.Order.name, schema: order_schema_1.OrderSchema }]),
            realtime_module_1.RealtimeModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [rider_dispatch_processor_1.RiderDispatchProcessor],
        exports: [bullmq_1.BullModule],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map