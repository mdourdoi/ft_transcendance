import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MatchesController } from './matches.controller.js';
import { MatchesService } from './matches.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [MatchesService],
  controllers: [MatchesController],
  exports: [MatchesService],
})
export class MatchesModule {}
