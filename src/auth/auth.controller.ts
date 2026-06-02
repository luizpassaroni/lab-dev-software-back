import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UnauthorizedException,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import type { Request, Response } from 'express';
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
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // TODO: Implementar comparação segura de senhas com bcrypt e validação contra banco de dados
    // TODO: Setar token HttpOnly após validação bem-sucedida
    const { email, password } = loginDto;
    const user = await this.userService.findByEmail(email);

    if (!user || password !== user.password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = this.authService.createPayload(user.id, loginDto.email);

    const accessToken = this.authService.generateToken(payload);
    res.cookie('access_token', accessToken, { httpOnly: true });
    return { message: 'Login realizado com sucesso' };
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

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logout realizado com sucesso' };
  }
}
