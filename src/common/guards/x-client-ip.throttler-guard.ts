import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class XClientIpThrottlerGuard extends ThrottlerGuard {
  // Atrás do BFF, req.ip é sempre o IP do Next; o IP real vem no X-Client-IP.
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return (req.headers['x-client-ip'] as string) ?? req.ip;
  }

  protected async throwThrottlingException(
    _context: ExecutionContext,
  ): Promise<void> {
    throw new ThrottlerException('Muitas tentativas, aguarde alguns minutos.');
  }
}
