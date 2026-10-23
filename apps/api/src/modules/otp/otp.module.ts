import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    UsersModule,
    AuthModule, // provides AuthService (issueTokens) and JwtModule
  ],
  providers: [OtpService],
  controllers: [OtpController],
})
export class OtpModule {}
