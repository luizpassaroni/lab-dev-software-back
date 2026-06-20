import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TitlesService } from './titles.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { TitleType } from './dto/title-type.enum';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { SearchResponseDto } from './dto/search-response.dto';
import { TitleDetailDto } from './dto/title-detail.dto';
import { DiscoverQueryDto } from './dto/discover-query.dto';

@ApiTags('Titles')
@ApiSecurity('internal-key')
@Controller('titles')
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Busca filmes e séries pelo nome' })
  @ApiOkResponse({ type: SearchResponseDto })
  search(@Query() query: SearchQueryDto): Promise<SearchResponseDto> {
    return this.titlesService.search(query.q, query.page);
  }

  @Get('discover')
  @ApiOperation({ summary: 'Descobre filmes e séries por gênero' })
  @ApiOkResponse({ type: SearchResponseDto })
  @ApiBadRequestResponse({ description: 'Gênero ou página inválidos' })
  @ApiBadGatewayResponse({ description: 'TMDB indisponível' })
  discover(@Query() query: DiscoverQueryDto): Promise<SearchResponseDto> {
    return this.titlesService.discover(query.genre, query.page);
  }

  @Get(':type/:id')
  @ApiOperation({ summary: 'Obtém os detalhes de um filme ou série' })
  @ApiParam({ name: 'type', enum: TitleType })
  @ApiParam({ name: 'id', type: Number, example: 872585 })
  @ApiOkResponse({ type: TitleDetailDto })
  getDetail(
    @Param('type', new ParseEnumPipe(TitleType)) type: TitleType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TitleDetailDto> {
    return this.titlesService.getDetail(type, id);
  }
}
