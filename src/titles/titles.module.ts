import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';
import { TmdbHttpService } from './tmdb-http.service';

@Module({
  imports: [HttpModule],
  controllers: [TitlesController],
  providers: [TitlesService, TmdbHttpService],
  exports: [TmdbHttpService],
})
export class TitlesModule {}
