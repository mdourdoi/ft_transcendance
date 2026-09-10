import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AVATAR_UPLOAD_DIR } from './constants';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: AVATAR_UPLOAD_DIR,
      serveRoot: '/avatars',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MessagesModule,
  ],
})
export class AppModule {}
