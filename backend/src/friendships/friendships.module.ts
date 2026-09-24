import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FriendshipsController } from './friendships.controller.js';
import { FriendshipsService } from './friendships.service.js';

@Module({
  providers: [FriendshipsService],
  controllers: [FriendshipsController],
  imports: [PrismaModule, AuthModule, MessagesModule],
})
export class FriendshipsModule {}
