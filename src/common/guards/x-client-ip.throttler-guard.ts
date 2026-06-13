import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Custom ThrottlerGuard que lê o IP real do cliente a partir do header X-Client-IP.
 * 
 * BFF: Como o browser não fala direto com o Nest (passa por Next.js),
 * req.ip seria sempre o IP do Next. Este guard extrai X-Client-IP
 * (repassado pelo Next e confiável porque o InternalKeyGuard garante a origem).
 * 
 * Fallback para req.ip se X-Client-IP não estiver presente.
 */
@Injectable()
export class XClientIpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Lê X-Client-IP do header (repassado pelo Next, confiável via InternalKeyGuard)
    const clientIp = req.headers['x-client-ip'] as string;
    
    if (clientIp) {
      return clientIp;
    }
    
    // Fallback para req.ip (em caso de bypass do Next)
    return req.ip || 'unknown';
  }
}
