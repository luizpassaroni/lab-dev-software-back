import { Controller, Get } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { GenreDto } from './dto/genre.dto';
import { TitlesService } from './titles.service';

@ApiTags('Genres')
@ApiSecurity('internal-key')
@Controller('genres')
export class GenresController {
  constructor(private readonly titlesService: TitlesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os gêneros de filmes e séries' })
  @ApiOkResponse({ type: GenreDto, isArray: true })
  @ApiBadGatewayResponse({ description: 'TMDB indisponível' })
  getGenres(): Promise<GenreDto[]> {
    return this.titlesService.getGenres();
  }
}
