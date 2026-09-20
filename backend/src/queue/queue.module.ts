import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MatchesModule } from '../matches/matches.module';
import { UsersModule } from '../users/users.module';
import { MatchmakingService } from './matchmaking.service';
import { QueueGateway } from './queue.gateway';
import { QueueService } from './queue.service';

@Module({
  imports: [AuthModule, UsersModule, MatchesModule],
  providers: [QueueGateway, QueueService, MatchmakingService],
})
export class QueueModule {}
