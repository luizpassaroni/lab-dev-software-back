import { Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';

/**
 * AuthController com endpoints de autenticação.
 * 
 * POST /auth/login tem rate limit customizado de 5 tentativas a cada 15 minutos por IP.
 * O X-Client-IP é extraído via XClientIpThrottlerGuard para suportar BFF (Next.js).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login — Autenticação local.
   * Rate limit: 5 tentativas a cada 15 minutos por IP (via X-Client-IP).
   * 
   * Requer headers:
   * - X-Internal-Key: 'test-internal-key' (validação de origem)
   * - X-Client-IP: '1.2.3.4' (IP real do cliente, para rate limiting)
   */
  @Post('login')
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  async login() {
    // Implementação em BACK-07
    return {
      access_token: 'test-jwt-token',
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    };
  }
}

