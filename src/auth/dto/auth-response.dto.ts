import { ApiProperty } from '@nestjs/swagger';
import { ResponseCreateUserDto } from '../../user/dto/response-create-user.dto';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT válido por 24 horas.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;

  @ApiProperty({ type: () => ResponseCreateUserDto })
  user!: ResponseCreateUserDto;
}

export class ProfileResponseDto {
  @ApiProperty({ type: () => ResponseCreateUserDto })
  user!: ResponseCreateUserDto;
}
