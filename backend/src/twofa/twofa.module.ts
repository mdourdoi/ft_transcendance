import { Module } from '@nestjs/common';
import { TwofaService } from './twofa.service';
import { TwofaController } from './twofa.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [TwofaService],
  controllers: [TwofaController],
  imports: [AuthModule]
})
export class TwofaModule {}
