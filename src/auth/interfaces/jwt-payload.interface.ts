/**
 * Interface que representa o payload (conteúdo) de um JWT token
 * @property sub - ID do usuário (subject)
 * @property email - Email do usuário
 * @property iat - Timestamp de emissão (opcional)
 * @property exp - Timestamp de expiração (opcional)
 */
export interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}
