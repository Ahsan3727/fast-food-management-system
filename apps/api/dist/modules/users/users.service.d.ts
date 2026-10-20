import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { UpdateProfileDto, UpdateAddressDto } from './users.dto';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    findById(id: string): Promise<UserDocument>;
    findByPhone(phone: string): Promise<UserDocument | null>;
    findByEmail(email: string): Promise<UserDocument | null>;
    create(data: Partial<User>): Promise<UserDocument>;
    updateProfile(id: string, dto: UpdateProfileDto): Promise<UserDocument>;
    updateAddress(id: string, dto: UpdateAddressDto): Promise<UserDocument>;
    saveFcmToken(userId: string, fcmToken: string): Promise<void>;
    clearFcmToken(userId: string): Promise<void>;
    suspendUser(id: string): Promise<void>;
    activateUser(id: string): Promise<void>;
    findOnlineRiders(): Promise<UserDocument[]>;
    listAll(role?: string, page?: number, limit?: number): Promise<(import("mongoose").FlattenMaps<UserDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
//# sourceMappingURL=users.service.d.ts.map