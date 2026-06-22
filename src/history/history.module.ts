import { Module } from '@nestjs/common';
import { RatingController } from './rating/rating.controller';
import { RatingService } from './rating/rating.service';
import { WatchedController } from './watched/watched.controller';
import { WatchedService } from './watched/watched.service';
import { FavoriteController } from './favorite/favorite.controller';
import { FavoriteService } from './favorite/favorite.service';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { TitlesModule } from '../titles/titles.module';

@Module({
  imports: [TitlesModule],
  controllers: [
    RatingController,
    WatchedController,
    FavoriteController,
    ProfileController,
  ],
  providers: [RatingService, WatchedService, FavoriteService, ProfileService],
})
export class HistoryModule {}