import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard que valida o header X-Internal-Key.
 * 
 * PRD §8: O Next.js (BFF) passa X-Internal-Key para comprovar origem.
 * Este guard deve rodar ANTES do ThrottlerGuard para garantir que
 * apenas requisições autorizadas são contadas no rate limit.
 * 
 * ISSUE-BACK-16: Implementação simplificada para MVP (sem .env).
 */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  // Chave interna fixa para MVP (em produção via @nestjs/config)
  private readonly INTERNAL_KEY = 'test-internal-key';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const internalKey = request.headers['x-internal-key'];

    if (internalKey !== this.INTERNAL_KEY) {
      // Rejeitar sem expor detalhes (segurança)
      throw new Error('Unauthorized');
    }

    return true;
  }
}
