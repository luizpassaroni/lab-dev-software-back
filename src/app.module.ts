import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TitlesModule } from './titles/titles.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { validate } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 3_600_000,
    }),
    PrismaModule,
    TitlesModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
