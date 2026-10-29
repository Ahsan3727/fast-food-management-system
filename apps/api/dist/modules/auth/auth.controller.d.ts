import { AuthService } from './auth.service';
declare class LoginDto {
    identifier: string;
    password: string;
}
declare class CustomerSessionDto {
    name: string;
    phone: string;
}
declare class RequestOtpDto {
    phone: string;
}
declare class VerifyOtpDto {
    phone: string;
    code: string;
    name?: string;
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
    requestOtp(dto: RequestOtpDto): Promise<{
        success: boolean;
        message: string;
        cooldownSeconds: number;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
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