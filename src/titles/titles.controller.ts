import { Controller, Get, Query } from '@nestjs/common';
import { TitlesService } from './titles.service';

@Controller('titles')
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}

  /**
   * GET /titles/search
   * Endpoint simples de teste (não tem @Throttle customizado).
   * Usa o default global de rate limit (100 req/min).
   * Não é afetado pelo limite estrito do login (5/15min).
   */
  @Get('search')
  async search(@Query('q') query: string) {
    return {
      query,
      results: [],
      message: 'Search endpoint (not rate-limited to 5/15min)',
    };
  }
}

