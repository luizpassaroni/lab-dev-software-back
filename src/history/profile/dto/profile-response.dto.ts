import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProfileTotaisDto {
  @ApiProperty({ example: 12 })
  @Expose()
  vistos!: number;

  @ApiProperty({ example: 7 })
  @Expose()
  avaliados!: number;

  @ApiProperty({ example: 5 })
  @Expose()
  favoritos!: number;

  constructor(partial: Partial<ProfileTotaisDto>) {
    Object.assign(this, partial);
  }
}

export class CardDto {
  @ApiProperty({ example: 872585 })
  @Expose()
  tmdbId!: number;

  @ApiProperty({ example: 'MOVIE' })
  @Expose()
  tmdbType!: 'MOVIE' | 'TV';

  @ApiProperty({ example: 'Oppenheimer' })
  @Expose()
  title!: string;

  @ApiProperty({ example: 2023, nullable: true })
  @Expose()
  year!: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  posterUrl!: string | null;

  constructor(partial: Partial<CardDto>) {
    Object.assign(this, partial);
  }
}

export class RatedCardDto extends CardDto {
  @ApiProperty({ example: 9 })
  @Expose()
  score!: number;

  constructor(partial: Partial<RatedCardDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

export class ProfileResponseDto {
  @ApiProperty({ type: () => ProfileTotaisDto })
  @Expose()
  @Type(() => ProfileTotaisDto)
  totais!: ProfileTotaisDto;

  @ApiProperty({ type: () => [CardDto] })
  @Expose()
  @Type(() => CardDto)
  vistos!: CardDto[];

  @ApiProperty({ type: () => [RatedCardDto] })
  @Expose()
  @Type(() => RatedCardDto)
  avaliados!: RatedCardDto[];

  @ApiProperty({ type: () => [CardDto] })
  @Expose()
  @Type(() => CardDto)
  favoritos!: CardDto[];

  constructor(partial: Partial<ProfileResponseDto>) {
    Object.assign(this, partial);
  }
}