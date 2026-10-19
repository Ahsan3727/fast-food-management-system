import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { UpdateProfileDto, UpdateAddressDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone }).select('+password').exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateAddress(id: string, dto: UpdateAddressDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: { savedAddress: dto } }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async saveFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $set: { fcmToken } }).exec();
  }

  async clearFcmToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } }).exec();
  }

  async suspendUser(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { isSuspended: true } }).exec();
  }

  async activateUser(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { $set: { isSuspended: false } }).exec();
  }

  // Find all riders who are currently online (for delivery dispatch)
  async findOnlineRiders(): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: 'rider', isOnline: true, isSuspended: false })
      .select('_id fcmToken name')
      .lean() as unknown as UserDocument[];
  }

  async listAll(role?: string, page = 1, limit = 50) {
    const filter: Record<string, unknown> = {};
    if (role) filter['role'] = role;
    const skip = (page - 1) * Math.min(limit, 100);
    return this.userModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 100))
      .select('-password')
      .lean();
  }
}
