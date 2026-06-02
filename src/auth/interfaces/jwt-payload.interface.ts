/**
 * Interface que representa o payload (conteúdo) de um JWT token
 */
export interface JwtPayload {
  /** ID do usuário (subject) */
  sub: string;

  /** Email do usuário */
  email: string;

  /** Timestamp de emissão (in seconds) */
  iat?: number;

  /** Timestamp de expiração (in seconds) - configurado automaticamente pelo @nestjs/jwt */
  exp?: number;
}
