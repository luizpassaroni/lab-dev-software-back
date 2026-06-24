import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupSwagger } from '../src/swagger';
import { OpenAPIObject } from '@nestjs/swagger';
import { App } from 'supertest/types';

describe('Swagger documentation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-only';
    process.env.TMDB_API_TOKEN = 'test-tmdb-token';
    process.env.SWAGGER_ENABLED = 'true';
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    expect(setupSwagger(app)).toBe(true);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('expõe a interface interativa em /api/docs', () => {
    return request(app.getHttpServer())
      .get('/api/docs')
      .expect(200)
      .expect('Content-Type', /html/);
  });

  it('expõe o documento OpenAPI com os contratos e autenticações principais', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    const document = response.body as OpenAPIObject;

    expect(document.info.title).toBe('Guia de Streaming API');
    expect(document.paths).toHaveProperty('/auth/login');
    expect(document.paths).toHaveProperty('/auth/me');
    expect(document.paths).toHaveProperty('/titles/search');
    expect(document.paths).toHaveProperty('/titles/discover');
    expect(document.paths).toHaveProperty('/genres');
    expect(document.components?.securitySchemes).toMatchObject({
      bearer: {
        type: 'http',
        scheme: 'bearer',
      },
      'internal-key': {
        type: 'apiKey',
        in: 'header',
        name: 'X-Internal-Key',
      },
    });
    expect(document.paths['/auth/me'].get?.security).toEqual(
      expect.arrayContaining([{ bearer: [] }, { 'internal-key': [] }]),
    );
    expect(document.paths['/titles/discover'].get?.security).toEqual([
      { 'internal-key': [] },
    ]);
    expect(document.paths['/genres'].get?.security).toEqual([
      { 'internal-key': [] },
    ]);
    expect(document.components?.schemas).toHaveProperty('LoginDto');
    expect(document.components?.schemas).toHaveProperty('SearchResponseDto');
    expect(document.components?.schemas).toHaveProperty('GenreDto');
  });

  it('não habilita a documentação em produção', () => {
    process.env.NODE_ENV = 'production';

    expect(setupSwagger(app)).toBe(false);

    process.env.NODE_ENV = 'test';
  });
});
