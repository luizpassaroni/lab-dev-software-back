import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GenreDto {
  @ApiProperty({ example: 28 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Ação' })
  @Expose()
  nome!: string;

  constructor(partial: Partial<GenreDto>) {
    Object.assign(this, partial);
  }
}
