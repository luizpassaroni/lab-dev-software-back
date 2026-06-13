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

@Controller('titles')
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}

  @Get('search')
  search(@Query() query: SearchQueryDto) {
    return this.titlesService.search(query.q, query.page);
  }

  @Get(':type/:id')
  getDetail(
    @Param('type', new ParseEnumPipe(TitleType)) type: TitleType,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.titlesService.getDetail(type, id);
  }
}
