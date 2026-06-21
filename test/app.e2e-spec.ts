import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { INTERNAL_KEY } from './setup-e2e';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    // Definir JWT_SECRET para testes
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-only';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  it('/ (GET) sem X-Internal-Key', () => {
    return request(app.getHttpServer()).get('/').expect(401);
  });

  it('/ (GET) com X-Internal-Key', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('X-Internal-Key', INTERNAL_KEY)
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  afterEach(async () => {
    await app.close();
  });
});
