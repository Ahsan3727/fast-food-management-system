import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Model } from 'mongoose';
import { RefreshTokenDocument } from './refresh-token.schema';
export declare class AuthService {
    private usersService;
    private jwtService;
    private config;
    private refreshTokenModel;
    constructor(usersService: UsersService, jwtService: JwtService, config: ConfigService, refreshTokenModel: Model<RefreshTokenDocument>);
    refresh(oldToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    issueTokens(userId: string, role: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private hashToken;
}
//# sourceMappingURL=auth.service.d.ts.map