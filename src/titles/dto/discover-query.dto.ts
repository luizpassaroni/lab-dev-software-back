import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class DiscoverQueryDto {
  @ApiProperty({ example: 28, description: 'ID do gênero na TMDB' })
  @Type(() => Number)
  @IsInt()
  genre!: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
}
