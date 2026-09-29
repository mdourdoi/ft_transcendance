import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MatchesModule } from '../matches/matches.module.js';
import { UsersModule } from '../users/users.module.js';
import { MatchmakingService } from './matchmaking.service.js';
import { QueueGateway } from './queue.gateway.js';
import { QueueService } from './queue.service.js';

@Module({
  imports: [AuthModule, UsersModule, MatchesModule],
  providers: [QueueGateway, QueueService, MatchmakingService],
})
export class QueueModule {}
