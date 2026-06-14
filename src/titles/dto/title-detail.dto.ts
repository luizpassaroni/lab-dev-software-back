import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CastMemberDto {
  @ApiProperty({ example: 'Cillian Murphy' })
  @Expose()
  name!: string;

  @ApiProperty({ example: 'J. Robert Oppenheimer' })
  @Expose()
  character!: string;

  @ApiProperty({ nullable: true })
  @Expose()
  profileUrl!: string | null;

  constructor(partial: Partial<CastMemberDto>) {
    Object.assign(this, partial);
  }
}

export class ProviderDto {
  @ApiProperty({ example: 'Netflix' })
  @Expose()
  name!: string;

  @ApiProperty({ nullable: true })
  @Expose()
  logoUrl!: string | null;

  constructor(partial: Partial<ProviderDto>) {
    Object.assign(this, partial);
  }
}

export class ProvidersDto {
  @ApiProperty({ type: () => [ProviderDto] })
  @Expose()
  @Type(() => ProviderDto)
  flatrate!: ProviderDto[];

  @ApiProperty({ type: () => [ProviderDto] })
  @Expose()
  @Type(() => ProviderDto)
  rent!: ProviderDto[];

  @ApiProperty({ type: () => [ProviderDto] })
  @Expose()
  @Type(() => ProviderDto)
  buy!: ProviderDto[];

  constructor(partial: Partial<ProvidersDto>) {
    Object.assign(this, partial);
  }
}

export class TitleDetailDto {
  @ApiProperty({ example: 872585 })
  @Expose()
  tmdbId!: number;

  @ApiProperty({ enum: ['MOVIE', 'TV'], example: 'MOVIE' })
  @Expose()
  tmdbType!: 'MOVIE' | 'TV';

  @ApiProperty({ example: 'Oppenheimer' })
  @Expose()
  title!: string;

  @ApiProperty({ example: 2023, nullable: true })
  @Expose()
  year!: number | null;

  @ApiProperty()
  @Expose()
  overview!: string;

  @ApiProperty({ nullable: true })
  @Expose()
  posterUrl!: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  backdropUrl!: string | null;

  @ApiProperty({ example: 180, nullable: true })
  @Expose()
  runtime!: number | null;

  @ApiProperty({ example: null, nullable: true })
  @Expose()
  seasons!: number | null;

  @ApiProperty({ example: 8.1 })
  @Expose()
  tmdbRating!: number;

  @ApiProperty({ type: [String], example: ['Drama', 'História'] })
  @Expose()
  genres!: string[];

  @ApiProperty({ type: () => [CastMemberDto] })
  @Expose()
  @Type(() => CastMemberDto)
  cast!: CastMemberDto[];

  @ApiProperty({ type: () => ProvidersDto })
  @Expose()
  @Type(() => ProvidersDto)
  providers!: ProvidersDto;

  constructor(partial: Partial<TitleDetailDto>) {
    Object.assign(this, partial);
  }
}
