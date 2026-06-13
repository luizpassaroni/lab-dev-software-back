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
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ResponseCreateUserDto } from '../user/dto/response-create-user.dto';

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
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
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
  async getProfile(@Req() request: any) {
    const user = await this.userService.findById(request.user.userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      user: new ResponseCreateUserDto(
        user.id,
        user.name,
        user.email,
        user.createdAt,
      ),
    };
  }
}
