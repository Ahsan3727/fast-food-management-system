import { Document, Types } from 'mongoose';
import { Role } from '@fastfood/shared-types';
export type UserDocument = User & Document;
export declare class User {
    name: string;
    email?: string;
    phone?: string;
    role: Role;
    isActive: boolean;
    isSuspended: boolean;
    isOnline: boolean;
    fcmToken?: string;
    savedAddress?: {
        lat: number;
        lng: number;
        addressLine: string;
        landmark?: string;
    };
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=user.schema.d.ts.map