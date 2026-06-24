import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';
import { TmdbHttpService } from './tmdb-http.service';
import { GenresController } from './genres.controller';


@Module({
  imports: [HttpModule],
  controllers: [TitlesController, GenresController],
  providers: [TitlesService, TmdbHttpService],
  exports: [TmdbHttpService, TitlesService],
})
export class TitlesModule {}
