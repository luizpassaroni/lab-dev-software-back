/**
 * Request autenticado: o JwtAuthGuard popula `req.user` a partir do JWT
 * (ver JwtStrategy.validate, que mapeia `sub` -> `userId`). Use em controllers
 * protegidos para tipar o `@Req()` e garantir ownership por `req.user.userId`.
 */
export interface AuthenticatedRequest {
  user: {
    userId: number;
  };
}