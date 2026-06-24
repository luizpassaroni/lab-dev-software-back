import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class DiscoverQueryDto {
  @ApiPropertyOptional({ example: 28, description: 'ID do gênero na TMDB' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  genre?: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
}
