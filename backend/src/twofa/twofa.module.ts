import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TwofaController } from './twofa.controller.js';
import { TwofaService } from './twofa.service.js';

@Module({
  providers: [TwofaService],
  controllers: [TwofaController],
  imports: [AuthModule],
})
export class TwofaModule {}
