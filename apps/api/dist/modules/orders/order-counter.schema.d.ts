import { Document } from 'mongoose';
export type OrderCounterDocument = OrderCounter & Document;
export declare class OrderCounter {
    _id: string;
    seq: number;
}
export declare const OrderCounterSchema: import("mongoose").Schema<OrderCounter, import("mongoose").Model<OrderCounter, any, any, any, Document<unknown, any, OrderCounter, any, {}> & OrderCounter & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OrderCounter, Document<unknown, {}, import("mongoose").FlatRecord<OrderCounter>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<OrderCounter> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
//# sourceMappingURL=order-counter.schema.d.ts.map