import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Validate required environment variables
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'trocar-em-producao') {
    console.error(
      '❌ FATAL: JWT_SECRET is not configured or is using the default unsafe value.\n' +
      'Please set JWT_SECRET in your .env file.\n' +
      'To generate a secure secret: openssl rand -base64 32\n' +
      'Or use: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"\n',
    );
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
