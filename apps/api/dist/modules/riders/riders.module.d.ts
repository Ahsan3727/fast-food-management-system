import { Model, Document } from 'mongoose';
import { UsersService } from '../users/users.service';
export type RiderDocument = Rider & Document;
export declare class Rider {
    userId: string;
    isOnline: boolean;
    totalDeliveries: number;
    unsettledCashPaisa: number;
}
export declare const RiderSchema: import("mongoose").Schema<Rider, Model<Rider, any, any, any, Document<unknown, any, Rider, any, {}> & Rider & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Rider, Document<unknown, {}, import("mongoose").FlatRecord<Rider>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Rider> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare class RidersService {
    private riderModel;
    private usersService;
    constructor(riderModel: Model<RiderDocument>, usersService: UsersService);
    setOnlineStatus(userId: string, isOnline: boolean): Promise<Document<unknown, {}, RiderDocument, {}, {}> & Rider & Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getDashboard(userId: string): Promise<{
        isOnline: boolean;
        unsettledCashPaisa: number;
        totalDeliveries: number;
    }>;
    addUnsettledCash(userId: string, amountPaisa: number): Promise<void>;
    settleRider(userId: string): Promise<void>;
}
export declare class RidersModule {
}
//# sourceMappingURL=riders.module.d.ts.map