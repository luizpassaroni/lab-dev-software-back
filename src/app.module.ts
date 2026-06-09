import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TitlesModule } from './titles/titles.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { XClientIpThrottlerGuard } from './common/guards/x-client-ip.throttler-guard';
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
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    TitlesModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: XClientIpThrottlerGuard,
    },
  ],
})
export class AppModule {}
