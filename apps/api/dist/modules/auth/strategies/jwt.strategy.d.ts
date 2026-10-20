import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: {
        sub: string;
        role: string;
    }): Promise<{
        sub: string;
        role: string;
    }>;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map