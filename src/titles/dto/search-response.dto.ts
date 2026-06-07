import { Expose, Type } from 'class-transformer';

export class TitleSearchItemDto {
  @Expose() tmdbId: number;
  @Expose() tmdbType: 'MOVIE' | 'TV';
  @Expose() title: string;
  @Expose() year: number | null;
  @Expose() posterUrl: string | null;
  @Expose() badge: 'Filme' | 'Série';

  constructor(partial: Partial<TitleSearchItemDto>) {
    Object.assign(this, partial);
  }
}

export class SearchResponseDto {
  @Expose()
  @Type(() => TitleSearchItemDto)
  results: TitleSearchItemDto[];

  @Expose() page: number;
  @Expose() totalPages: number;
  @Expose() hasMore: boolean;

  constructor(partial: Partial<SearchResponseDto>) {
    Object.assign(this, partial);
  }
}
