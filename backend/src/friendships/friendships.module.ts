import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';

@Module({
  providers: [FriendshipsService],
  controllers: [FriendshipsController],
  imports: [PrismaModule, AuthModule],
})
export class FriendshipsModule {}
