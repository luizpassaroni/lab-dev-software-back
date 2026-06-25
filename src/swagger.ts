import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): boolean {
  const isEnabled =
    process.env.SWAGGER_ENABLED === 'true'

  if (!isEnabled) {
    return false;
  }

  const config = new DocumentBuilder()
    .setTitle('Guia de Streaming API')
    .setDescription('Contrato da API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT retornado por POST /auth/login.',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-Internal-Key',
        description: 'Chave compartilhada entre o BFF e o Nest.',
      },
      'internal-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Guia de Streaming API',
  });

  return true;
}
