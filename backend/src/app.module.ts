import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServeStaticModule } from "@nestjs/serve-static";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UsersModule, ServeStaticModule.forRoot({
    rootPath: '/app/uploads/avatars',
    serveRoot: '/avatars'
  })],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
