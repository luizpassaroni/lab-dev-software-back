import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RatingValueDto {
  @ApiProperty({ example: 8, minimum: 1, maximum: 10 })
  @Expose()
  score!: number;

  constructor(partial: Partial<RatingValueDto>) {
    Object.assign(this, partial);
  }
}

export class WatchedValueDto {
  @ApiProperty({ enum: ['manual', 'auto'], example: 'auto' })
  @Expose()
  origem!: 'manual' | 'auto';

  constructor(partial: Partial<WatchedValueDto>) {
    Object.assign(this, partial);
  }
}

export class RatingResponseDto {
  @ApiProperty({ type: () => RatingValueDto })
  @Expose()
  @Type(() => RatingValueDto)
  rating!: RatingValueDto;

  @ApiProperty({ type: () => WatchedValueDto })
  @Expose()
  @Type(() => WatchedValueDto)
  watched!: WatchedValueDto;

  constructor(partial: Partial<RatingResponseDto>) {
    Object.assign(this, partial);
  }
}
