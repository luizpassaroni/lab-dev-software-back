import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ResponseCreateUserDto } from '../user/dto/response-create-user.dto';
import { MeDto } from './dto/me.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /**
   * Endpoint de login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userService.findByEmail(email);
    const isPasswordValid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = this.authService.createPayload(user.id, loginDto.email);
    const accessToken = this.authService.generateToken(payload);

    return {
      access_token: accessToken,
      user: new ResponseCreateUserDto(
        user.id,
        user.name,
        user.email,
        user.createdAt,
      ),
    };
  }

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ResponseCreateUserDto> {
    const user = await this.userService.create(createUserDto);

    return new ResponseCreateUserDto(
      user.id,
      user.name,
      user.email,
      user.createdAt,
    );
  }

  /**
   * Acesso: GET /auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() request: any) {
    const user = request.user;

    return new MeDto(user.userId, user.email, user.iat);
  }
}
