import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { InternalKeyGuard } from './internal-key.guard';
import { XClientIpThrottlerGuard } from './x-client-ip.throttler-guard';
import { Public } from '../decorators/public.decorator';

const INTERNAL_KEY = 'test-internal-key-16chars';

@Controller()
class DummyController {
  @Get('probe')
  probe() {
    return { ok: true };
  }

  @Public()
  @Get('open')
  open() {
    return { ok: true };
  }
}

const configMock = { getOrThrow: () => INTERNAL_KEY };

describe('InternalKeyGuard', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [DummyController],
      providers: [
        { provide: APP_GUARD, useClass: InternalKeyGuard },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('bloqueia /probe sem header com 401 genérico', () => {
    return request(app.getHttpServer())
      .get('/probe')
      .expect(401)
      .expect((res) => {
        expect(res.body.message).not.toContain('internal');
        expect(res.body.message).not.toContain('X-Internal-Key');
      });
  });

  it('bloqueia /probe com chave errada com 401', () => {
    return request(app.getHttpServer())
      .get('/probe')
      .set('X-Internal-Key', 'chave-errada-aqui-16x')
      .expect(401);
  });

  it('libera /probe com chave correta', () => {
    return request(app.getHttpServer())
      .get('/probe')
      .set('X-Internal-Key', INTERNAL_KEY)
      .expect(200);
  });

  it('libera /open marcada com @Public sem header', () => {
    return request(app.getHttpServer()).get('/open').expect(200);
  });
});

describe('InternalKeyGuard roda antes do throttler', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 3 }])],
      controllers: [DummyController],
      providers: [
        { provide: APP_GUARD, useClass: InternalKeyGuard },
        { provide: APP_GUARD, useClass: XClientIpThrottlerGuard },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function probe(withKey: boolean) {
    const req = request(app.getHttpServer())
      .get('/probe')
      .set('X-Client-IP', '1.2.3.4');
    return withKey ? req.set('X-Internal-Key', INTERNAL_KEY) : req;
  }

  it('barra sem chave com 401 e nunca deixa o throttler contar', async () => {
    for (let i = 0; i < 5; i += 1) {
      await probe(false).expect(401);
    }
  });

  it('com chave válida o throttler conta: 3 passam e a 4ª é 429', async () => {
    await probe(true).expect(200);
    await probe(true).expect(200);
    await probe(true).expect(200);
    await probe(true).expect(429);
  });
});
