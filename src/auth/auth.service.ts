import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Gera um JWT token para um usuário
   * @param payload Dados do usuário a serem codificados no token
   * @returns Objeto contendo o access_token
   */
  generateToken(payload: JwtPayload) {
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Valida e decodifica um JWT token
   * @param token Token JWT a validar
   * @returns Payload decodificado
   * @throws UnauthorizedException se token for inválido ou expirado
   */
  validateToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }

  /**
   * Cria um payload padrão para um usuário
   * Pode ser estendido com mais informações conforme necessário
   * @param userId ID do usuário
   * @param email Email do usuário
   * @returns JwtPayload formatado
   */
  createPayload(userId: string, email: string): JwtPayload {
    return {
      sub: userId,
      email,
      iat: Math.floor(Date.now() / 1000),
    };
  }
}
