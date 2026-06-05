import { Expose } from 'class-transformer';

export class MeDto {
  constructor(userId: number, email: string, iat?: number) {
    this.userId = userId;
    this.email = email;
    if (iat !== undefined) {
      this.iat = iat;
    }
  }

  @Expose()
  userId: number;

  @Expose()
  email: string;

  @Expose()
  iat?: number;
}
