import { Expose, Type } from 'class-transformer';

export class CastMemberDto {
  @Expose() name: string;
  @Expose() character: string;
  @Expose() profileUrl: string | null;

  constructor(partial: Partial<CastMemberDto>) {
    Object.assign(this, partial);
  }
}

export class ProviderDto {
  @Expose() name: string;
  @Expose() logoUrl: string | null;

  constructor(partial: Partial<ProviderDto>) {
    Object.assign(this, partial);
  }
}

export class ProvidersDto {
  @Expose()
  @Type(() => ProviderDto)
  flatrate: ProviderDto[];

  @Expose()
  @Type(() => ProviderDto)
  rent: ProviderDto[];

  @Expose()
  @Type(() => ProviderDto)
  buy: ProviderDto[];

  constructor(partial: Partial<ProvidersDto>) {
    Object.assign(this, partial);
  }
}

export class TitleDetailDto {
  @Expose() tmdbId: number;
  @Expose() tmdbType: 'MOVIE' | 'TV';
  @Expose() title: string;
  @Expose() year: number | null;
  @Expose() overview: string;
  @Expose() posterUrl: string | null;
  @Expose() backdropUrl: string | null;
  @Expose() runtime: number | null;
  @Expose() seasons: number | null;
  @Expose() tmdbRating: number;
  @Expose() genres: string[];

  @Expose()
  @Type(() => CastMemberDto)
  cast: CastMemberDto[];

  @Expose()
  @Type(() => ProvidersDto)
  providers: ProvidersDto;

  constructor(partial: Partial<TitleDetailDto>) {
    Object.assign(this, partial);
  }
}
