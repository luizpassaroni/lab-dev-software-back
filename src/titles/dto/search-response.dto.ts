import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TitleSearchItemDto {
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

  @ApiProperty({
    example: 'https://image.tmdb.org/t/p/w500/poster.jpg',
    nullable: true,
  })
  @Expose()
  posterUrl!: string | null;

  @ApiProperty({ enum: ['Filme', 'Série'], example: 'Filme' })
  @Expose()
  badge!: 'Filme' | 'Série';

  constructor(partial: Partial<TitleSearchItemDto>) {
    Object.assign(this, partial);
  }
}

export class SearchResponseDto {
  @ApiProperty({ type: () => [TitleSearchItemDto] })
  @Expose()
  @Type(() => TitleSearchItemDto)
  results!: TitleSearchItemDto[];

  @ApiProperty({ example: 1 })
  @Expose()
  page!: number;

  @ApiProperty({ example: 4 })
  @Expose()
  totalPages!: number;

  @ApiProperty({ example: true })
  @Expose()
  hasMore!: boolean;

  constructor(partial: Partial<SearchResponseDto>) {
    Object.assign(this, partial);
  }
}
