import { Model, Document } from 'mongoose';
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
export declare class RidersModule {
}
//# sourceMappingURL=riders.module.d.ts.map