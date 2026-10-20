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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RidersModule = exports.RiderSchema = exports.Rider = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const mongoose_3 = require("@nestjs/mongoose");
const mongoose_4 = require("mongoose");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const shared_types_1 = require("@fastfood/shared-types");
let Rider = class Rider {
    userId; // links to users collection
    isOnline;
    totalDeliveries;
    unsettledCashPaisa; // integer paisa
};
exports.Rider = Rider;
__decorate([
    (0, mongoose_3.Prop)({ required: true }),
    __metadata("design:type", String)
], Rider.prototype, "userId", void 0);
__decorate([
    (0, mongoose_3.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Rider.prototype, "isOnline", void 0);
__decorate([
    (0, mongoose_3.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Rider.prototype, "totalDeliveries", void 0);
__decorate([
    (0, mongoose_3.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Rider.prototype, "unsettledCashPaisa", void 0);
exports.Rider = Rider = __decorate([
    (0, mongoose_3.Schema)({ timestamps: true })
], Rider);
exports.RiderSchema = mongoose_3.SchemaFactory.createForClass(Rider);
exports.RiderSchema.index({ userId: 1 }, { unique: true });
// ── Rider Service ────────────────────────────
let RidersService = class RidersService {
    riderModel;
    constructor(riderModel) {
        this.riderModel = riderModel;
    }
    async setOnlineStatus(userId, isOnline) {
        return this.riderModel.findOneAndUpdate({ userId }, { $set: { isOnline } }, { upsert: true, new: true });
    }
    async getDashboard(userId) {
        const rider = await this.riderModel.findOne({ userId }).lean();
        return {
            isOnline: rider?.isOnline ?? false,
            unsettledCashPaisa: rider?.unsettledCashPaisa ?? 0,
            totalDeliveries: rider?.totalDeliveries ?? 0,
        };
    }
    async addUnsettledCash(userId, amountPaisa) {
        await this.riderModel.findOneAndUpdate({ userId }, { $inc: { unsettledCashPaisa: amountPaisa, totalDeliveries: 1 } }, { upsert: true });
    }
    async settleRider(userId) {
        await this.riderModel.findOneAndUpdate({ userId }, { $set: { unsettledCashPaisa: 0 } });
    }
};
RidersService = __decorate([
    (0, common_2.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(Rider.name)),
    __metadata("design:paramtypes", [mongoose_4.Model])
], RidersService);
// ── Rider Controller ─────────────────────────
let RidersController = class RidersController {
    ridersService;
    constructor(ridersService) {
        this.ridersService = ridersService;
    }
    getDashboard(req) {
        return this.ridersService.getDashboard(req.user.sub);
    }
    setStatus(req, body) {
        return this.ridersService.setOnlineStatus(req.user.sub, body.isOnline);
    }
    settleRider(userId) {
        return this.ridersService.settleRider(userId);
    }
};
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.Role.RIDER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RidersController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.Role.RIDER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RidersController.prototype, "setStatus", null);
__decorate([
    (0, common_1.Post)(':userId/settle'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RidersController.prototype, "settleRider", null);
RidersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('riders'),
    __metadata("design:paramtypes", [RidersService])
], RidersController);
// ── Riders Module ─────────────────────────────
let RidersModule = class RidersModule {
};
exports.RidersModule = RidersModule;
exports.RidersModule = RidersModule = __decorate([
    (0, common_1.Module)({
        imports: [mongoose_2.MongooseModule.forFeature([{ name: Rider.name, schema: exports.RiderSchema }])],
        providers: [RidersService],
        controllers: [RidersController],
        exports: [RidersService],
    })
], RidersModule);
//# sourceMappingURL=riders.module.js.map