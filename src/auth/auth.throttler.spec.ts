import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { XClientIpThrottlerGuard } from '../common/guards/x-client-ip.throttler-guard';

describe('Auth login throttler', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
      controllers: [AuthController],
      providers: [
        { provide: APP_GUARD, useClass: XClientIpThrottlerGuard },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn().mockResolvedValue(null),
            findById: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: { createPayload: jest.fn(), generateToken: jest.fn() },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function login(clientIp: string) {
    return request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Client-IP', clientIp)
      .send({ email: 'user@example.com', password: 'password123' });
  }

  it('libera 5 tentativas e bloqueia a 6ª com 429', async () => {
    for (let i = 0; i < 5; i += 1) {
      await login('1.2.3.4').expect(401);
    }

    await login('1.2.3.4')
      .expect(429)
      .expect((res) => {
        expect(res.body.message).toContain('Muitas tentativas');
      });
  });

  it('isola o limite por X-Client-IP', async () => {
    await login('9.9.9.9').expect(401);
  });
});
