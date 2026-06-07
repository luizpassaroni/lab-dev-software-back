import { Controller, Get, Query } from '@nestjs/common';
import { TitlesService } from './titles.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('titles')
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}

  @Get('search')
  search(@Query() query: SearchQueryDto) {
    return this.titlesService.search(query.q, query.page);
  }
}
