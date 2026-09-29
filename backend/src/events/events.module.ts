import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway.js';
import { AuthModule } from '../auth/auth.module.js';
import { FriendshipsModule } from '../friendships/friendships.module.js';
import { MessagesModule } from '../messages/messages.module.js';

@Module({
  providers: [EventsGateway],
  imports: [AuthModule, FriendshipsModule, MessagesModule],
})
export class EventsModule {}
