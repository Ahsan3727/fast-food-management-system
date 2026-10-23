import { AuthService } from './auth.service';
declare class RefreshDto {
    refreshToken: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: any): Promise<void>;
}
export {};
//# sourceMappingURL=auth.controller.d.ts.map