import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FavoriteResponseDto {
  @ApiProperty({ example: true })
  @Expose()
  favorite!: boolean;

  constructor(partial: Partial<FavoriteResponseDto>) {
    Object.assign(this, partial);
  }
}