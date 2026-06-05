import { plainToInstance } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  constructor(port: number, jwtSecret: string) {
    this.PORT = port;
    this.JWT_SECRET = jwtSecret;
  }

  @IsOptional()
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
