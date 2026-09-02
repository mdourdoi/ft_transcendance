import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtGuard } from './jwt.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtGuard],
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '1h' } })]
})
export class AuthModule {}
