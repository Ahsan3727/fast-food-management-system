import { Model } from 'mongoose';
import { Category, CategoryDocument, MenuItem, MenuItemDocument } from './menu.schema';
declare class CreateCategoryDto {
    name: string;
    icon?: string;
    image?: string;
}
declare class CreateMenuItemDto {
    name: string;
    description?: string;
    categoryId: string;
    basePrice: number;
    image?: string;
    emoji?: string;
    isAvailable?: boolean;
    sizes?: {
        label: string;
        price: number;
    }[];
    addOns?: {
        label: string;
        price: number;
    }[];
}
export declare class MenuService {
    private categoryModel;
    private menuItemModel;
    constructor(categoryModel: Model<CategoryDocument>, menuItemModel: Model<MenuItemDocument>);
    getCategories(): Promise<(import("mongoose").FlattenMaps<CategoryDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    createCategory(dto: CreateCategoryDto): Promise<import("mongoose").Document<unknown, {}, CategoryDocument, {}, {}> & Category & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getMenu(categoryId?: string): Promise<(import("mongoose").FlattenMaps<MenuItemDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getItemById(id: string): Promise<import("mongoose").FlattenMaps<MenuItemDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    searchMenu(q: string): Promise<(import("mongoose").FlattenMaps<MenuItemDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    createMenuItem(dto: CreateMenuItemDto): Promise<import("mongoose").Document<unknown, {}, MenuItemDocument, {}, {}> & MenuItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    toggleAvailability(id: string): Promise<import("mongoose").Document<unknown, {}, MenuItemDocument, {}, {}> & MenuItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /** Validate cart items and return calculated total in paisa */
    validateCartAndPrice(items: {
        menuItemId: string;
        quantity: number;
        sizeLabel?: string;
        addOns?: string[];
    }[]): Promise<{
        itemSnapshots: object[];
        totalPaisa: number;
    }>;
}
export {};
//# sourceMappingURL=menu.service.d.ts.map