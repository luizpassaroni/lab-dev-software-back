import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({
    example: 8,
    minimum: 1,
    maximum: 10,
    description: 'Nota inteira de 1 a 10 que o usuário logado dá ao título.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  score!: number;
}
