import { Module } from '@nestjs/common';
import { RatingController } from './rating/rating.controller';
import { RatingService } from './rating/rating.service';
import { WatchedController } from './watched/watched.controller';
import { WatchedService } from './watched/watched.service';
import { FavoriteController } from './favorite/favorite.controller';
import { FavoriteService } from './favorite/favorite.service';

@Module({
  controllers: [RatingController, WatchedController, FavoriteController],
  providers: [RatingService, WatchedService, FavoriteService],
})
export class HistoryModule {}