import { plainToInstance } from 'class-transformer';
import {
  IsNumber,
  IsString,
  MinLength,
  NotContains,
  validateSync,
} from 'class-validator';

// Define o formato rigoroso do seu .env
export class EnvironmentVariables {
  constructor(port: number, jwtSecret: string) {
    this.PORT = port;
    this.JWT_SECRET = jwtSecret;
  }
  @IsNumber()
  PORT: number = 3000;

  @IsString()
  @MinLength(16, {
    message: 'O JWT_SECRET precisa ter no mínimo 16 caracteres.',
  })
  JWT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `\nFalha na validação das variáveis de ambiente:\n${errors.toString()}`,
    );
  }

  return validatedConfig;
}
