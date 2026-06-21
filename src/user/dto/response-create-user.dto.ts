import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ResponseCreateUserDto {
  constructor(id: number, name: string, email: string, createdAt: Date) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.createdAt = createdAt;
  }

  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Test User' })
  @Expose()
  name!: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', format: 'date-time' })
  @Expose()
  createdAt!: Date;
}
