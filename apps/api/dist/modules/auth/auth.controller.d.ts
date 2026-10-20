import { AuthService } from './auth.service';
declare class RegisterDto {
    name: string;
    phone: string;
    email?: string;
    password: string;
}
declare class LoginDto {
    identifier: string;
    password: string;
}
declare class RefreshDto {
    refreshToken: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
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