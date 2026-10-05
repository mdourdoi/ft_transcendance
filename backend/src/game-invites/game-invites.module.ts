import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FriendshipsModule } from '../friendships/friendships.module.js';
import { GameModule } from '../game/game.module.js';
import { MatchesModule } from '../matches/matches.module.js';
import { QueueModule } from '../queue/queue.module.js';
import { UsersModule } from '../users/users.module.js';
import { GameInvitesController } from './game-invites.controller.js';
import { GameInvitesService } from './game-invites.service.js';

@Module({
  imports: [
    AuthModule,
    FriendshipsModule,
    UsersModule,
    MatchesModule,
    GameModule,
    QueueModule,
  ],
  providers: [GameInvitesService],
  controllers: [GameInvitesController],
})
export class GameInvitesModule {}
