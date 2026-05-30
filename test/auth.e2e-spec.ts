import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Definir JWT_SECRET para testes
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-only';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('deve retornar um token JWT com email e password válidos', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(typeof res.body.access_token).toBe('string');
          expect(res.body.access_token.split('.').length).toBe(3); // JWT tem 3 partes
        });
    });

    it('deve retornar erro 400 com email inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('deve retornar erro 400 com password muito curta', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '123', // menos de 6 caracteres
        })
        .expect(400);
    });

    it('deve retornar erro 400 se email estiver faltando', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('deve retornar erro 400 se password estiver faltando', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('GET /auth/profile', () => {
    let token: string;

    beforeAll(async () => {
      // Fazer login para obter token
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      token = loginRes.body.access_token;
    });

    it('deve retornar dados do usuário com token JWT válido', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Acesso autorizado');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('userId');
          expect(res.body.user).toHaveProperty('email');
        });
    });

    it('deve retornar erro 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('deve retornar erro 401 com token JWT inválido', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('deve retornar erro 401 com Authorization header malformado', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `${token}`) // Sem "Bearer"
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let token: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      token = loginRes.body.access_token;
    });

    it('deve retornar um novo token JWT válido', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(typeof res.body.access_token).toBe('string');
          // O novo token deve ser um JWT válido (3 partes separadas por ponto)
          expect(res.body.access_token.split('.').length).toBe(3);
        });
    });

    it('deve retornar erro 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);
    });

    it('deve retornar erro 401 com token JWT inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('JWT Token Validation', () => {
    it('deve preservar dados do usuário através do token refresh', async () => {
      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        });

      const initialToken = loginRes.body.access_token;

      // Verificar dados originais
      const profileRes1 = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${initialToken}`)
        .expect(200);

      const initialUser = profileRes1.body.user;

      // Refresh token
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${initialToken}`)
        .expect(201);

      const newToken = refreshRes.body.access_token;

      // Verificar dados com novo token
      const profileRes2 = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      const newUser = profileRes2.body.user;

      // Email deve ser preservado
      expect(newUser.email).toBe(initialUser.email);
      expect(newUser.userId).toBe(initialUser.userId);
    });
  });
});
