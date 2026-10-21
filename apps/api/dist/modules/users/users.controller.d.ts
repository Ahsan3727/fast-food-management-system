import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateAddressDto } from './users.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<{
        user: any;
    }>;
    updateMe(req: any, dto: UpdateProfileDto): Promise<{
        user: import("./user.schema").UserDocument;
    }>;
    updateAddress(req: any, dto: UpdateAddressDto): Promise<{
        user: import("./user.schema").UserDocument;
    }>;
    updateFcmToken(req: any, body: {
        fcmToken: string;
    }): Promise<{
        ok: boolean;
    }>;
    listUsers(role?: string, page?: number, limit?: number): Promise<{
        users: (import("mongoose").FlattenMaps<import("./user.schema").UserDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    updateStatus(id: string, body: {
        isSuspended?: boolean;
    }): Promise<{
        user: import("./user.schema").UserDocument;
    }>;
}
//# sourceMappingURL=users.controller.d.ts.map