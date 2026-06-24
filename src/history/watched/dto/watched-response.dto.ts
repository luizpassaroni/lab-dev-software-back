import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WatchedStateDto {
  @ApiProperty({ enum: ['manual', 'auto'], example: 'manual' })
  @Expose()
  origem!: 'manual' | 'auto';

  constructor(partial: Partial<WatchedStateDto>) {
    Object.assign(this, partial);
  }
}

export class WatchedResponseDto {
  @ApiProperty({ type: () => WatchedStateDto })
  @Expose()
  @Type(() => WatchedStateDto)
  watched!: WatchedStateDto;

  constructor(partial: Partial<WatchedResponseDto>) {
    Object.assign(this, partial);
  }
}
