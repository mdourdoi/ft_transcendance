import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';

@Module({
  providers: [MessagesService],
  exports: [MessagesService],
  controllers: [MessagesController],
  imports: [PrismaModule, AuthModule],
})
export class MessagesModule {}
