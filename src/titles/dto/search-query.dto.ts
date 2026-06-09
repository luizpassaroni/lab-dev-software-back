import { Transform, Type } from 'class-transformer';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class SearchQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  q: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
}
