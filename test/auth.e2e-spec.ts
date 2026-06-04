import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type StoredUser = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  const users = new Map<string, StoredUser>();
  let nextUserId = 1;

  const prismaMock = {
    user: {
      create: jest.fn(({ data }) => {
        const user: StoredUser = {
          id: nextUserId,
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        };

        nextUserId += 1;
        users.set(user.email, user);
        return Promise.resolve(user);
      }),
      findUnique: jest.fn(({ where }) => {
        return Promise.resolve(users.get(where.email) ?? null);
      }),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-only';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.listen(0);
  });

  beforeEach(() => {
    users.clear();
    nextUserId = 1;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  function registerUser(email = 'test@example.com') {
    return request(app.getHttpServer()).post('/auth/register').send({
      name: 'Test User',
      email,
      password: 'password123',
    });
  }

  describe('POST /auth/register', () => {
    it('deve criar usuário sem retornar token nem setar cookie', async () => {
      await registerUser()
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            createdAt: '2026-01-01T00:00:00.000Z',
          });
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).not.toHaveProperty('passwordHash');
          expect(res.body).not.toHaveProperty('access_token');
          expect(res.headers['set-cookie']).toBeUndefined();
        });

      const persistedUser = users.get('test@example.com');

      expect(persistedUser?.passwordHash).toEqual(expect.any(String));
      expect(persistedUser?.passwordHash).not.toBe('password123');
    });

    it('deve retornar erro 400 com senha menor que 8 caracteres', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '1234567',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('deve retornar access_token e user no corpo, sem cookie', async () => {
      await registerUser();

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(typeof res.body.access_token).toBe('string');
          expect(res.body.access_token.split('.')).toHaveLength(3);
          expect(res.body.user).toEqual({
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            createdAt: '2026-01-01T00:00:00.000Z',
          });
          expect(res.headers['set-cookie']).toBeUndefined();
        });
    });

    it('deve retornar erro 401 com senha inválida', async () => {
      await registerUser();

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        })
        .expect(401);
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

    it('deve retornar erro 400 se password estiver vazio', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '',
        })
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    async function loginAndGetToken() {
      await registerUser();

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      return loginRes.body.access_token as string;
    }

    it('deve retornar dados do usuário com Authorization Bearer válido', async () => {
      const token = await loginAndGetToken();

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId', 1);
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('iat');
        });
    });

    it('deve retornar erro 401 sem Authorization Bearer', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('deve ignorar cookie access_token e retornar 401', async () => {
      const token = await loginAndGetToken();

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', [`access_token=${token}`])
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('não deve existir no Nest', () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(404);
    });
  });
});
