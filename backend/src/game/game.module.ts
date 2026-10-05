import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MatchesModule } from '../matches/matches.module.js';
import { GameGateway } from './game.gateway.js';
import { GameService } from './game.service.js';

@Module({
  imports: [AuthModule, MatchesModule],
  providers: [GameGateway, GameService],
  exports: [GameService],
})
export class GameModule {}
