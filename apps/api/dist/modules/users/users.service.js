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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./user.schema");
let UsersService = class UsersService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async findById(id) {
        const user = await this.userModel.findById(id).exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async findByPhone(phone) {
        return this.userModel.findOne({ phone }).select('+password').exec();
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email }).select('+password').exec();
    }
    async create(data) {
        const user = new this.userModel(data);
        return user.save();
    }
    async updateProfile(id, dto) {
        const user = await this.userModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
            .exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updateAddress(id, dto) {
        const user = await this.userModel
            .findByIdAndUpdate(id, { $set: { savedAddress: dto } }, { new: true })
            .exec();
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async saveFcmToken(userId, fcmToken) {
        await this.userModel.findByIdAndUpdate(userId, { $set: { fcmToken } }).exec();
    }
    async clearFcmToken(userId) {
        await this.userModel.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } }).exec();
    }
    async suspendUser(id) {
        await this.userModel.findByIdAndUpdate(id, { $set: { isSuspended: true } }).exec();
    }
    async activateUser(id) {
        await this.userModel.findByIdAndUpdate(id, { $set: { isSuspended: false } }).exec();
    }
    async setOnlineStatus(id, isOnline) {
        await this.userModel.findByIdAndUpdate(id, { $set: { isOnline } }).exec();
    }
    // Find all riders who are currently online (for delivery dispatch)
    async findOnlineRiders() {
        return this.userModel
            .find({ role: 'rider', isOnline: true, isSuspended: false })
            .select('_id fcmToken name')
            .lean();
    }
    async listAll(role, page = 1, limit = 50) {
        const filter = {};
        if (role)
            filter['role'] = role;
        const skip = (page - 1) * Math.min(limit, 100);
        return this.userModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Math.min(limit, 100))
            .select('-password')
            .lean();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map