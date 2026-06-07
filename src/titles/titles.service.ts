import { BadGatewayException, Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { TmdbHttpService } from './tmdb-http.service';
import { SearchResponseDto, TitleSearchItemDto } from './dto/search-response.dto';
import {
  TmdbMultiSearchResponse,
  TmdbMultiSearchResult,
} from './tmdb.types';

const SEARCH_TTL_MS = 3_600_000;

@Injectable()
export class TitlesService {
  private readonly logger = new Logger(TitlesService.name);

  constructor(
    private readonly tmdb: TmdbHttpService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async search(q: string, page: number): Promise<SearchResponseDto> {
    const key = `search:${q.trim().toLowerCase()}:${page}`;
    const cached = await this.cache.get<SearchResponseDto>(key);
    if (cached) return cached;

    let data: TmdbMultiSearchResponse;
    try {
      data = await this.tmdb.get<TmdbMultiSearchResponse>('/search/multi', {
        query: q,
        page,
      });
    } catch (err) {
      this.logger.error(
        `[tmdb] search_failed q="${q}" page=${page}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new BadGatewayException(
        'Não foi possível buscar agora. Tente novamente.',
      );
    }

    const results = data.results
      .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      .map((r) => this.toItem(r));

    const dto = new SearchResponseDto({
      results,
      page: data.page,
      totalPages: data.total_pages,
      hasMore: data.page < data.total_pages,
    });

    await this.cache.set(key, dto, SEARCH_TTL_MS);
    return dto;
  }

  private toItem(r: TmdbMultiSearchResult): TitleSearchItemDto {
    const isMovie = r.media_type === 'movie';
    const date = isMovie ? r.release_date : r.first_air_date;
    const year = date ? Number(date.slice(0, 4)) || null : null;
    return new TitleSearchItemDto({
      tmdbId: r.id,
      tmdbType: isMovie ? 'MOVIE' : 'TV',
      title: r.title ?? r.name ?? '',
      year,
      posterUrl: r.poster_path
        ? `https://image.tmdb.org/t/p/w500${r.poster_path}`
        : null,
      badge: isMovie ? 'Filme' : 'Série',
    });
  }
}
