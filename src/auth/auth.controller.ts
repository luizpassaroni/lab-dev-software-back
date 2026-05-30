import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de login (exemplo)
   * Nota: Em produção, você deve validar credenciais contra banco de dados
   */
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    // TODO: Validar email/password contra banco de dados
    // TODO: Retornar usuário após validação bem-sucedida

    // Exemplo: assumindo que credenciais são válidas
    const payload = this.authService.createPayload(
      'user-id-example', // substitua com ID real do usuário
      loginDto.email,
    );

    return this.authService.generateToken(payload);
  }

  /**
   * Endpoint protegido - requer JWT válido
   * Acesso: GET /auth/profile com Authorization: Bearer <token>
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(
    @Request()
    req: ExpressRequest & {
      user?: { userId: string; email: string; iat?: number };
    },
  ) {
    return {
      message: 'Acesso autorizado',
      user: req.user,
    };
  }

  /**
   * Endpoint de refresh token (exemplo)
   * Revalida o token atual e retorna um novo
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  refresh(
    @Request()
    req: ExpressRequest & {
      user?: { userId: string; email: string; iat?: number };
    },
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Token inválido');
    }
    const { userId, email } = req.user;
    const newPayload = this.authService.createPayload(userId, email);
    return this.authService.generateToken(newPayload);
  }
}
