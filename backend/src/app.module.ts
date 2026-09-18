import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { AVATAR_UPLOAD_DIR } from './constants';
import { FriendshipsModule } from './friendships/friendships.module';
import { MatchesModule } from './matches/matches.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { TwofaModule } from './twofa/twofa.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ServeStaticModule.forRoot({
      rootPath: AVATAR_UPLOAD_DIR,
      serveRoot: '/avatars',
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    MessagesModule,
    TwofaModule,
    FriendshipsModule,
    MatchesModule,
  ],
})
export class AppModule {}
