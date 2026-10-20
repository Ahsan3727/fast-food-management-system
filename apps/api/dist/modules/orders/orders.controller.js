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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const shared_types_1 = require("@fastfood/shared-types");
const class_validator_1 = require("class-validator");
class CreateOrderDto {
    items;
    deliveryAddress;
    payment;
    notes;
}
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateOrderDto.prototype, "deliveryAddress", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateOrderDto.prototype, "payment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "notes", void 0);
class TransitionDto {
    status;
    note;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransitionDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransitionDto.prototype, "note", void 0);
class DeliverDto {
    otp;
    cashCollectedPaisa;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliverDto.prototype, "otp", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DeliverDto.prototype, "cashCollectedPaisa", void 0);
class CancelDto {
    reason;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelDto.prototype, "reason", void 0);
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    // ── Customer: place order ─────────────────────────────
    createOrder(req, dto, idempotencyKey) {
        return this.ordersService.create(req.user.sub, { ...dto, idempotencyKey });
    }
    // ── Customer: list my orders ──────────────────────────
    listMyOrders(req, page = 1, limit = 20) {
        return this.ordersService.listForCustomer(req.user.sub, +page, +limit);
    }
    // ── Customer: get delivery OTP (tracking screen only) ─
    getOtp(req, id) {
        return this.ordersService.getOtpForCustomer(id, req.user.sub);
    }
    // ── Customer: cancel ──────────────────────────────────
    cancelOrder(req, id, dto) {
        return this.ordersService.cancel(id, req.user.sub, dto.reason);
    }
    // ── Rider: available orders ───────────────────────────
    getAvailable() {
        return this.ordersService.getAvailableOrders();
    }
    // ── Rider: accept (atomic) ────────────────────────────
    acceptOrder(req, id) {
        return this.ordersService.riderAccept(id, req.user.sub);
    }
    // ── Rider: active order ───────────────────────────────
    getActiveOrder(req) {
        return this.ordersService.getRiderActiveOrder(req.user.sub);
    }
    // ── Rider: deliver with OTP ───────────────────────────
    deliver(req, id, dto) {
        return this.ordersService.verifyOtpAndDeliver(id, req.user.sub, dto.otp, dto.cashCollectedPaisa);
    }
    // ── Admin / Staff: all orders ─────────────────────────
    listAll(status, page = 1, limit = 50) {
        return this.ordersService.listAll(status, +page, +limit);
    }
    // ── Admin / Staff: transition status ─────────────────
    transition(req, id, dto) {
        return this.ordersService.transition(id, dto.status, req.user.sub, req.user.role, dto.note);
    }
    // ── Any authenticated: get by ID ──────────────────────
    getById(req, id) {
        return this.ordersService.getById(id, req.user.sub, req.user.role);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateOrderDto, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "listMyOrders", null);
__decorate([
    (0, common_1.Get)(':id/otp'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getOtp", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CancelDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.Role.RIDER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getAvailable", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.Role.RIDER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "acceptOrder", null);
__decorate([
    (0, common_1.Get)('rider/active'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.Role.RIDER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getActiveOrder", null);
__decorate([
    (0, common_1.Post)(':id/deliver'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.Role.RIDER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, DeliverDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "deliver", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.Role.ADMIN, shared_types_1.Role.STAFF),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "listAll", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.Role.ADMIN, shared_types_1.Role.STAFF, shared_types_1.Role.RIDER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, TransitionDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "transition", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getById", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map