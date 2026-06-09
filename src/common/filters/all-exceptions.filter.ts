import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { Logger } from 'nestjs-pino';

/**
 * Global exception filter para capturar erros não-tratados.
 * - HttpException conhecidas passam com seu status original
 * - Demais erros retornam 500 com mensagem genérica e são logados com level: 'error'
 * - Stack trace é logado, mas NUNCA vaza na resposta HTTP
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject() private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Se é HttpException conhecida, retorna seu status e mensagem
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      return response.status(status).json(exceptionResponse);
    }

    // Para demais erros (não-mapeados), loga com stack e retorna 500 genérico
    this.logger.error(
      {
        message: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        path: request?.['url'] || 'unknown',
        method: request?.['method'] || 'unknown',
      },
      'Unhandled exception',
    );

    response.status(500).json({
      message: 'Erro interno.',
    });
  }
}
