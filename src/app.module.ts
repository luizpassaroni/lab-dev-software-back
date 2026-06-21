import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TitlesModule } from './titles/titles.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { HistoryModule } from './history/history.module';
import { XClientIpThrottlerGuard } from './common/guards/x-client-ip.throttler-guard';
import { InternalKeyGuard } from './common/guards/internal-key.guard';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filters';
import { validate } from './env.validation';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-internal-key"]',
          'req.body',
          'body.password',
          'body.access_token',
          'body.token',
        ],
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
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
    HistoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: InternalKeyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: XClientIpThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ThrottlerExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
