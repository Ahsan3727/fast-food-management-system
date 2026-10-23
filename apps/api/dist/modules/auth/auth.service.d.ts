import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Model } from 'mongoose';
import { RefreshTokenDocument } from './refresh-token.schema';
import { Role } from '@fastfood/shared-types';
export declare class AuthService {
    private usersService;
    private jwtService;
    private config;
    private refreshTokenModel;
    constructor(usersService: UsersService, jwtService: JwtService, config: ConfigService, refreshTokenModel: Model<RefreshTokenDocument>);
    register(name: string, phone: string, password: string, email?: string): Promise<{
        user: {
            _id: string;
            name: string;
            phone: string | undefined;
            email: string | undefined;
            role: Role;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(identifier: string, password: string): Promise<{
        user: {
            _id: string;
            name: string;
            phone: string | undefined;
            email: string | undefined;
            role: Role;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    customerSession(name: string, phone: string): Promise<{
        user: {
            _id: string;
            name: string;
            phone: string | undefined;
            role: Role;
        };
        accessToken: string;
        refreshToken: string;
    }>;
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