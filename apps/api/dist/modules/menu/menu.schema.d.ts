import { Document } from 'mongoose';
export type CategoryDocument = Category & Document;
export type MenuItemDocument = MenuItem & Document;
export declare class Category {
    name: string;
    icon?: string;
    image?: string;
    sortOrder: number;
    isActive: boolean;
}
export declare const CategorySchema: import("mongoose").Schema<Category, import("mongoose").Model<Category, any, any, any, Document<unknown, any, Category, any, {}> & Category & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Category, Document<unknown, {}, import("mongoose").FlatRecord<Category>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Category> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare class MenuItem {
    name: string;
    description?: string;
    categoryId: string;
    basePrice: number;
    image?: string;
    emoji?: string;
    isAvailable: boolean;
    sizes: {
        label: string;
        price: number;
    }[];
    addOns: {
        label: string;
        price: number;
    }[];
}
export declare const MenuItemSchema: import("mongoose").Schema<MenuItem, import("mongoose").Model<MenuItem, any, any, any, Document<unknown, any, MenuItem, any, {}> & MenuItem & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MenuItem, Document<unknown, {}, import("mongoose").FlatRecord<MenuItem>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MenuItem> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=menu.schema.d.ts.map