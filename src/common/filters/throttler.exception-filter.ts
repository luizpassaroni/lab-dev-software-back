import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

/**
 * Custom exception filter para ThrottlerException (429).
 * Retorna mensagem genérica sem detalhar tempo restante (não vaza informações).
 */
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(429).json({
      message: 'Muitas tentativas, aguarde alguns minutos.',
    });
  }
}
