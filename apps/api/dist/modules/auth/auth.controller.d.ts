import { AuthService } from './auth.service';
declare class LoginDto {
    identifier: string;
    password: string;
}
declare class CustomerSessionDto {
    name: string;
    phone: string;
}
declare class RefreshDto {
    refreshToken: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        user: {
            _id: string;
            name: string;
            phone: string | undefined;
            email: string | undefined;
            role: import("@fastfood/shared-types").Role;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    customerSession(dto: CustomerSessionDto): Promise<{
        user: {
            _id: string;
            name: string;
            phone: string | undefined;
            role: import("@fastfood/shared-types").Role;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: any): Promise<void>;
}
export {};
//# sourceMappingURL=auth.controller.d.ts.map