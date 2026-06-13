import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * AuthModule com controllers e services de autenticação.
 * Será expandido em ISSUE-BACK-01 (JwtModule), ISSUE-BACK-06 (register) e ISSUE-BACK-07 (login).
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
