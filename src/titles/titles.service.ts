import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { TmdbHttpService } from './tmdb-http.service';
import {
  SearchResponseDto,
  TitleSearchItemDto,
} from './dto/search-response.dto';
import {
  CastMemberDto,
  ProviderDto,
  ProvidersDto,
  TitleDetailDto,
} from './dto/title-detail.dto';
import { TitleType } from './dto/title-type.enum';
import {
  TmdbDiscoverResponse,
  TmdbDiscoverResult,
  TmdbGenreListResponse,
  TmdbMultiSearchResponse,
  TmdbMultiSearchResult,
  TmdbProvider,
  TmdbTitleDetails,
  TmdbWatchProvidersResponse,
} from './tmdb.types';
import { GenreDto } from './dto/genre.dto';

const SEARCH_TTL_MS = 3_600_000;
const DISCOVER_TTL_MS = 3_600_000;
const DETAIL_TTL_MS = 86_400_000;
const PROVIDERS_TTL_MS = 43_200_000;

function isTmdbNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === 404
  );
}

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
      .filter(
        (r): r is TmdbMultiSearchResult & { media_type: 'movie' | 'tv' } =>
          r.media_type === 'movie' || r.media_type === 'tv',
      )
      .map((r) => this.toItem(r, r.media_type));

    const dto = new SearchResponseDto({
      results,
      page: data.page,
      totalPages: data.total_pages,
      hasMore: data.page < data.total_pages,
    });

    await this.cache.set(key, dto, SEARCH_TTL_MS);
    return dto;
  }

  async getGenres(): Promise<GenreDto[]> {
    const key = 'genres:all';
    const cached = await this.cache.get<GenreDto[]>(key);
    if (cached) return cached;

    let movieGenres: TmdbGenreListResponse;
    let tvGenres: TmdbGenreListResponse;
    try {
      [movieGenres, tvGenres] = await Promise.all([
        this.tmdb.get<TmdbGenreListResponse>('/genre/movie/list'),
        this.tmdb.get<TmdbGenreListResponse>('/genre/tv/list'),
      ]);
    } catch (err) {
      this.logger.error(
        '[tmdb] genres_failed',
        err instanceof Error ? err.stack : String(err),
      );
      throw new BadGatewayException(
        'Não foi possível carregar os gêneros agora. Tente novamente.',
      );
    }

    const genresById = new Map(
      [...movieGenres.genres, ...tvGenres.genres].map((genre) => [
        genre.id,
        new GenreDto({ id: genre.id, nome: genre.name }),
      ]),
    );
    const genres = [...genresById.values()].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR'),
    );

    await this.cache.set(key, genres);
    return genres;
  }

  async discover(
    genre: number | undefined,
    page: number,
  ): Promise<SearchResponseDto> {
    const key = `discover:${genre ?? 'trending'}:${page}`;
    const cached = await this.cache.get<SearchResponseDto>(key);
    if (cached) return cached;

    const params: Record<string, string | number | boolean> =
      genre === undefined ? { page } : { with_genres: genre, page };
    let movies: TmdbDiscoverResponse;
    let tv: TmdbDiscoverResponse;
    try {
      [movies, tv] = await Promise.all([
        this.tmdb.get<TmdbDiscoverResponse>('/discover/movie', params),
        this.tmdb.get<TmdbDiscoverResponse>('/discover/tv', params),
      ]);
    } catch (err) {
      this.logger.error(
        `[tmdb] discover_failed genre=${genre ?? 'trending'} page=${page}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new BadGatewayException(
        'Não foi possível buscar agora. Tente novamente.',
      );
    }

    const totalPages = Math.max(movies.total_pages, tv.total_pages);
    const dto = new SearchResponseDto({
      results: [
        ...movies.results.map((result) => this.toItem(result, 'movie')),
        ...tv.results.map((result) => this.toItem(result, 'tv')),
      ],
      page,
      totalPages,
      hasMore: page < totalPages,
    });

    await this.cache.set(key, dto, DISCOVER_TTL_MS);
    return dto;
  }

  private toItem(
    r: TmdbMultiSearchResult | TmdbDiscoverResult,
    mediaType: 'movie' | 'tv',
  ): TitleSearchItemDto {
    const isMovie = mediaType === 'movie';
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

async getCardSummary(
  type: TitleType,
  id: number,
): Promise<{
  tmdbId: number;
  tmdbType: 'MOVIE' | 'TV';
  title: string;
  year: number | null;
  posterUrl: string | null;
}> {
  try {
    const detail = await this.getDetailsPart(type, id);
    return {
      tmdbId: detail.tmdbId,
      tmdbType: detail.tmdbType,
      title: detail.title,
      year: detail.year,
      posterUrl: detail.posterUrl,
    };
  } catch {
    // Título indisponível na TMDB (deletado ou fora do ar) → retorna fallback
    return {
      tmdbId: id,
      tmdbType: type === TitleType.MOVIE ? 'MOVIE' : 'TV',
      title: '',
      year: null,
      posterUrl: null,
    };
  }
}

  async getDetail(type: TitleType, id: number): Promise<TitleDetailDto> {
    const detail = await this.getDetailsPart(type, id);
    const providers = await this.getProvidersPart(type, id);
    return new TitleDetailDto({ ...detail, providers });
  }

  private async getDetailsPart(
    type: TitleType,
    id: number,
  ): Promise<Omit<TitleDetailDto, 'providers'>> {
    const key = `detail:${type}:${id}`;
    const cached = await this.cache.get<Omit<TitleDetailDto, 'providers'>>(key);
    if (cached) return cached;

    let data: TmdbTitleDetails;
    try {
      data = await this.tmdb.get<TmdbTitleDetails>(`/${type}/${id}`, {
        append_to_response: 'credits',
      });
    } catch (err) {
      if (isTmdbNotFound(err)) {
        throw new NotFoundException('Título não encontrado.');
      }
      this.logger.error(
        `[tmdb] detail_failed type=${type} id=${id}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new BadGatewayException(
        'Não foi possível carregar agora. Tente novamente.',
      );
    }

    const isMovie = type === TitleType.MOVIE;
    const date = isMovie ? data.release_date : data.first_air_date;
    const year = date ? Number(date.slice(0, 4)) || null : null;
    const cast = (data.credits?.cast ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .slice(0, 10)
      .map(
        (c) =>
          new CastMemberDto({
            name: c.name,
            character: c.character,
            profileUrl: c.profile_path
              ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
              : null,
          }),
      );

    const detail = {
      tmdbId: data.id,
      tmdbType: isMovie ? ('MOVIE' as const) : ('TV' as const),
      title: data.title ?? data.name ?? '',
      year,
      overview: data.overview,
      posterUrl: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      backdropUrl: data.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
        : null,
      runtime: isMovie ? (data.runtime ?? null) : null,
      seasons: isMovie ? null : (data.number_of_seasons ?? null),
      tmdbRating: Math.round(data.vote_average * 10) / 10,
      genres: data.genres.map((g) => g.name),
      cast,
    };

    await this.cache.set(key, detail, DETAIL_TTL_MS);
    return detail;
  }

  private async getProvidersPart(
    type: TitleType,
    id: number,
  ): Promise<ProvidersDto> {
    const key = `providers:${type}:${id}`;
    const cached = await this.cache.get<ProvidersDto>(key);
    if (cached) return cached;

    let data: TmdbWatchProvidersResponse;
    try {
      data = await this.tmdb.get<TmdbWatchProvidersResponse>(
        `/${type}/${id}/watch/providers`,
      );
    } catch (err) {
      this.logger.error(
        `[tmdb] providers_failed type=${type} id=${id}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new BadGatewayException(
        'Não foi possível carregar agora. Tente novamente.',
      );
    }

    const br = data.results.BR;
    const providers = new ProvidersDto({
      flatrate: this.toProviders(br?.flatrate),
      rent: this.toProviders(br?.rent),
      buy: this.toProviders(br?.buy),
    });

    await this.cache.set(key, providers, PROVIDERS_TTL_MS);
    return providers;
  }

  private toProviders(list?: TmdbProvider[]): ProviderDto[] {
    return (list ?? [])
      .slice()
      .sort((a, b) => a.display_priority - b.display_priority)
      .map(
        (p) =>
          new ProviderDto({
            name: p.provider_name,
            logoUrl: p.logo_path
              ? `https://image.tmdb.org/t/p/w92${p.logo_path}`
              : null,
          }),
      );
  }
}
