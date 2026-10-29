import { MenuService } from './menu.service';
export declare class MenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
    getCategories(): Promise<(import("mongoose").FlattenMaps<import("./menu.schema").CategoryDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getMenu(categoryId?: string, includeUnavailable?: string): Promise<(import("mongoose").FlattenMaps<import("./menu.schema").MenuItemDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    search(q: string): Promise<(import("mongoose").FlattenMaps<import("./menu.schema").MenuItemDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getItem(id: string): Promise<import("mongoose").FlattenMaps<import("./menu.schema").MenuItemDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    createCategory(body: any): Promise<import("mongoose").Document<unknown, {}, import("./menu.schema").CategoryDocument, {}, {}> & import("./menu.schema").Category & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    createItem(body: any): Promise<import("mongoose").Document<unknown, {}, import("./menu.schema").MenuItemDocument, {}, {}> & import("./menu.schema").MenuItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    toggleAvailability(id: string): Promise<import("mongoose").Document<unknown, {}, import("./menu.schema").MenuItemDocument, {}, {}> & import("./menu.schema").MenuItem & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
//# sourceMappingURL=menu.controller.d.ts.map