import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { JwtGuard } from './jwt.guard.js';
import { TwofaVerifierService } from './twofa-verifier.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, TwofaVerifierService],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [JwtModule, TwofaVerifierService],
})
export class AuthModule {}
