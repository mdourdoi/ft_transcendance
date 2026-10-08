import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GameModule } from '../game/game.module.js';
import { MatchesModule } from '../matches/matches.module.js';
import { QueueModule } from '../queue/queue.module.js';
import { BotsController } from './bots.controller.js';
import { BotsService } from './bots.service.js';

@Module({
  imports: [AuthModule, MatchesModule, GameModule, QueueModule],
  providers: [BotsService],
  controllers: [BotsController],
})
export class BotsModule {}
