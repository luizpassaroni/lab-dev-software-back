import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TitlesModule } from './titles/titles.module';
import { AuthModule } from './auth/auth.module';
import { InternalKeyGuard } from './common/guards/internal-key.guard';
import { XClientIpThrottlerGuard } from './common/guards/x-client-ip.throttler-guard';
import { ThrottlerExceptionFilter } from './common/filters/throttler.exception-filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    // Logger estruturado com pino
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    // Cache global (1h default)
    CacheModule.register({
      isGlobal: true,
      ttl: 3_600_000,
    }),
    // Rate limiter global (100 req/min default, permissivo — apenas guarda-corpo)
    // Endpoints específicos podem sobrescrever via @Throttle decorator
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    // Módulos de features
    AuthModule,
    TitlesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // IMPORTANTE: Ordem dos guards — InternalKeyGuard ANTES do ThrottlerGuard
    // 1. InternalKeyGuard valida X-Internal-Key (origem do BFF/Next.js)
    // 2. XClientIpThrottlerGuard conta tentativa e aplica rate limit
    {
      provide: APP_GUARD,
      useClass: InternalKeyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: XClientIpThrottlerGuard,
    },
    // Exception filter global para ThrottlerException (429)
    {
      provide: APP_FILTER,
      useClass: ThrottlerExceptionFilter,
    },
    // Exception filter global para erros não-mapeados (5xx)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
