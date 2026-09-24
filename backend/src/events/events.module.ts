import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway.js';
import { AuthModule } from '../auth/auth.module.js';
import { FriendshipsModule } from '../friendships/friendships.module.js';

@Module({
  providers: [EventsGateway],
  imports: [AuthModule, FriendshipsModule],
})
export class EventsModule {}
