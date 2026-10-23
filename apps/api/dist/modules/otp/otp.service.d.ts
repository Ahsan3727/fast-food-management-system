import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
export declare class OtpService {
    private readonly redis;
    private readonly usersService;
    private readonly authService;
    private readonly config;
    private readonly logger;
    constructor(redis: RedisService, usersService: UsersService, authService: AuthService, config: ConfigService);
    /**
     * Generates a 6-digit OTP, hashes it with argon2, stores it in
     * Redis under `otp:<phone>` for 5 minutes, then sends via SMS.
     *
     * In development (NODE_ENV !== 'production') returns { code } in
     * the response for easy testing. Production returns {} (empty).
     */
    sendOtp(phone: string): Promise<{
        code?: string;
    }>;
    /**
     * Verifies the OTP against the Redis hash.
     * - If phone is new → creates a customer account (name required).
     * - If phone exists → authenticates the returning user.
     * Returns a JWT pair on success.
     */
    verifyOtp(phone: string, code: string, name?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
    }>;
    private generateCode;
    private sendSms;
}
//# sourceMappingURL=otp.service.d.ts.map