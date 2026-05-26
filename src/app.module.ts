import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TitlesModule } from './titles/titles.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 3_600_000,
    }),
    TitlesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
