import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { AuthModule } from './auth/auth.module.js';
import { BotsModule } from './bots/bots.module.js';
import { ErrorCode } from './common/error-codes.js';
import { HttpThrottlerGuard } from './common/http-throttler.guard.js';
import { RedisThrottlerStorage } from './common/redis-throttler.storage.js';
import { validateEnv } from './config/env.validation.js';
import { AVATAR_UPLOAD_DIR } from './constants.js';
import { EventsModule } from './events/events.module.js';
import { FriendshipsModule } from './friendships/friendships.module.js';
import { GameModule } from './game/game.module.js';
import { GameInvitesModule } from './game-invites/game-invites.module.js';
import { MailModule } from './mail/mail.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { QueueModule } from './queue/queue.module.js';
import { REDIS_CLIENT } from './redis/redis.constants.js';
import { RedisModule } from './redis/redis.module.js';
import { TwofaModule } from './twofa/twofa.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: AVATAR_UPLOAD_DIR,
      serveRoot: '/api/avatars',
    }),
    PrismaModule,
    MailModule,
    RedisModule,
    ThrottlerModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({
        throttlers: [{ ttl: 60_000, limit: 100 }],
        storage: new RedisThrottlerStorage(redis),
        errorMessage: ErrorCode.TOO_MANY_REQUESTS,
      }),
    }),
    AuthModule,
    UsersModule,
    MessagesModule,
    TwofaModule,
    FriendshipsModule,
    MatchesModule,
    QueueModule,
    GameModule,
    GameInvitesModule,
    BotsModule,
    EventsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: HttpThrottlerGuard }],
})
export class AppModule {}
