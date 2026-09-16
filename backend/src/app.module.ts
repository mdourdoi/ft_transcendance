import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AVATAR_UPLOAD_DIR } from './constants';
import { TwofaModule } from './twofa/twofa.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ServeStaticModule.forRoot({
      rootPath: AVATAR_UPLOAD_DIR,
      serveRoot: '/avatars',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MessagesModule,
    TwofaModule,
  ],
})
export class AppModule {}
