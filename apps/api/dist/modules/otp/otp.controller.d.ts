import { OtpService } from './otp.service';
declare class SendOtpDto {
    phone: string;
}
declare class VerifyOtpDto {
    phone: string;
    code: string;
    name?: string;
}
export declare class OtpController {
    private readonly otpService;
    constructor(otpService: OtpService);
    /**
     * POST /auth/otp/send
     * Rate-limited: 3 requests per minute per IP.
     * Dev:  returns { code: "123456" }
     * Prod: returns {} (sends SMS)
     */
    send(dto: SendOtpDto): Promise<{
        code?: string;
    }>;
    /**
     * POST /auth/otp/verify
     * Rate-limited: 5 attempts per minute per IP.
     * Returns { accessToken, refreshToken, isNewUser }
     */
    verify(dto: VerifyOtpDto): Promise<{
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
    }>;
}
export {};
//# sourceMappingURL=otp.controller.d.ts.map