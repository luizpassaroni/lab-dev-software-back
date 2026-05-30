import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    // cast the extractor to a known function type to satisfy strict lint rules
    // custom extractor to avoid relying on untyped external helpers
    const jwtFromRequest = (req: unknown): string | null => {
      try {
        const r = req as any;
        const authHeader =
          r?.headers?.authorization ?? r?.headers?.Authorization;
        if (!authHeader) return null;
        const parts = String(authHeader).split(' ');
        if (parts.length !== 2) return null;
        const [scheme, token] = parts;
        return /^Bearer$/i.test(scheme) ? token : null;
      } catch {
        return null;
      }
    };

    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  /**
   * Valida o payload do JWT
   * Este método é executado automaticamente pelo Passport após verificar a assinatura
   * @param payload Dados decodificados do JWT
   * @returns Objeto com informações do usuário para atribuir a req.user
   */
  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      iat: payload.iat,
    };
  }
}
