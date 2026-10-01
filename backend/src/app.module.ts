import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module.js';
import { validateEnv } from './config/env.validation.js';
import { AVATAR_UPLOAD_DIR } from './constants.js';
import { EventsModule } from './events/events.module.js';
import { FriendshipsModule } from './friendships/friendships.module.js';
import { MailModule } from './mail/mail.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { QueueModule } from './queue/queue.module.js';
import { RedisModule } from './redis/redis.module.js';
import { TwofaModule } from './twofa/twofa.module.js';
import { UsersModule } from './users/users.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ServeStaticModule.forRoot({
      rootPath: AVATAR_UPLOAD_DIR,
      serveRoot: '/avatars',
    }),
    PrismaModule,
    MailModule,
    RedisModule,
    AuthModule,
    UsersModule,
    MessagesModule,
    TwofaModule,
    FriendshipsModule,
    MatchesModule,
    QueueModule,
    EventsModule,
    EventEmitterModule.forRoot(),
  ],
})
export class AppModule {}
