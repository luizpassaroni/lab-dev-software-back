import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { INTERNAL_KEY } from './setup-e2e';

type StoredUser = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

type CompositeKey = { userId: number; tmdbId: number; tmdbType: string };
type RatingRow = CompositeKey & { score: number };
type WatchedRow = CompositeKey & { origem: 'manual' | 'auto' };

describe('Rating E2E (BACK-20)', () => {
  let app: INestApplication;

  const users = new Map<string, StoredUser>();
  let nextUserId = 1;
  let ratings: RatingRow[] = [];
  let watched: WatchedRow[] = [];

  const sameKey = (row: CompositeKey, k: CompositeKey) =>
    row.userId === k.userId &&
    row.tmdbId === k.tmdbId &&
    row.tmdbType === k.tmdbType;

  const matchesWhere = (
    row: Record<string, unknown>,
    where: Record<string, unknown>,
  ) => Object.keys(where).every((key) => row[key] === where[key]);

  // Mock stateful do Prisma: simula as tabelas rating/watched em memória
  // para validar o contrato HTTP de ponta a ponta sem banco real.
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
        if (where.email) {
          return Promise.resolve(users.get(where.email) ?? null);
        }
        if (where.id) {
          for (const user of users.values()) {
            if (user.id === where.id) return Promise.resolve(user);
          }
        }
        return Promise.resolve(null);
      }),
    },
    rating: {
      upsert: jest.fn(({ where, update, create }) => {
        const k = where.userId_tmdbId_tmdbType as CompositeKey;
        const existing = ratings.find((r) => sameKey(r, k));
        if (existing) {
          Object.assign(existing, update);
          return Promise.resolve({ ...existing });
        }
        const row = { ...create } as RatingRow;
        ratings.push(row);
        return Promise.resolve({ ...row });
      }),
      deleteMany: jest.fn(({ where }) => {
        const before = ratings.length;
        ratings = ratings.filter((r) => !matchesWhere(r, where));
        return Promise.resolve({ count: before - ratings.length });
      }),
    },
    watched: {
      upsert: jest.fn(({ where, update, create }) => {
        const k = where.userId_tmdbId_tmdbType as CompositeKey;
        const existing = watched.find((w) => sameKey(w, k));
        if (existing) {
          // update vazio = preserva a origem existente (inclusive 'manual')
          Object.assign(existing, update);
          return Promise.resolve({ ...existing });
        }
        const row = { ...create } as WatchedRow;
        watched.push(row);
        return Promise.resolve({ ...row });
      }),
      deleteMany: jest.fn(({ where }) => {
        const before = watched.length;
        watched = watched.filter((w) => !matchesWhere(w, where));
        return Promise.resolve({ count: before - watched.length });
      }),
    },
    // Transação interativa: executa a callback com o próprio mock como client.
    $transaction: jest.fn((cb) => cb(prismaMock)),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-only';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: async () => ({
          totalHits: 1,
          timeToExpire: 60,
          isBlocked: false,
          timeToBlockExpire: 0,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    users.clear();
    nextUserId = 1;
    ratings = [];
    watched = [];
    jest.clearAllMocks();
  });

  async function getToken(email = 'rater@example.com'): Promise<string> {
    await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-Internal-Key', INTERNAL_KEY)
      .send({ name: 'Rater', email, password: 'password123' });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Internal-Key', INTERNAL_KEY)
      .send({ email, password: 'password123' });

    return login.body.access_token as string;
  }

  const post = (path: string, token: string, body: unknown) =>
    request(app.getHttpServer())
      .post(path)
      .set('X-Internal-Key', INTERNAL_KEY)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const del = (path: string, token: string) =>
    request(app.getHttpServer())
      .delete(path)
      .set('X-Internal-Key', INTERNAL_KEY)
      .set('Authorization', `Bearer ${token}`);

  describe('POST /titles/:type/:id/rating', () => {
    it('avalia 8 sem visto prévio → 200 + Watched origem=auto', async () => {
      const token = await getToken();

      await post('/titles/movie/872585/rating', token, { score: 8 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            rating: { score: 8 },
            watched: { origem: 'auto' },
          });
        });

      expect(ratings).toHaveLength(1);
      expect(ratings[0]).toMatchObject({ tmdbType: 'MOVIE', score: 8 });
      expect(watched).toHaveLength(1);
      expect(watched[0]).toMatchObject({ origem: 'auto' });
    });

    it('trocar a nota (8 → 6) atualiza a mesma linha, sem duplicar', async () => {
      const token = await getToken();

      await post('/titles/movie/872585/rating', token, { score: 8 }).expect(200);
      await post('/titles/movie/872585/rating', token, { score: 6 })
        .expect(200)
        .expect((res) => expect(res.body.rating.score).toBe(6));

      expect(ratings).toHaveLength(1);
      expect(ratings[0].score).toBe(6);
      expect(watched).toHaveLength(1);
    });

    it('preserva visto manual: origem permanece manual ao avaliar', async () => {
      const token = await getToken();
      watched.push({
        userId: 1,
        tmdbId: 555,
        tmdbType: 'MOVIE',
        origem: 'manual',
      });

      await post('/titles/movie/555/rating', token, { score: 7 })
        .expect(200)
        .expect((res) => expect(res.body.watched.origem).toBe('manual'));

      expect(watched).toHaveLength(1);
      expect(watched[0].origem).toBe('manual');
    });

    it('série (tv) é traduzida para tmdbType "TV"', async () => {
      const token = await getToken();

      await post('/titles/tv/100/rating', token, { score: 9 }).expect(200);

      expect(ratings[0]).toMatchObject({ tmdbType: 'TV', score: 9 });
    });

    it.each([
      ['score acima de 10', { score: 11 }],
      ['score abaixo de 1', { score: 0 }],
      ['score não-inteiro', { score: 8.5 }],
      ['score não-numérico', { score: 'abc' }],
      ['score ausente', {}],
    ])('400 quando %s', async (_label, body) => {
      const token = await getToken();
      await post('/titles/movie/872585/rating', token, body).expect(400);
    });

    it('400 quando type é inválido', async () => {
      const token = await getToken();
      await post('/titles/banana/872585/rating', token, { score: 8 }).expect(
        400,
      );
    });

    it('400 quando id não é inteiro', async () => {
      const token = await getToken();
      await post('/titles/movie/abc/rating', token, { score: 8 }).expect(400);
    });

    it('401 sem Bearer', () => {
      return request(app.getHttpServer())
        .post('/titles/movie/872585/rating')
        .set('X-Internal-Key', INTERNAL_KEY)
        .send({ score: 8 })
        .expect(401);
    });

    it('401 com Bearer inválido', () => {
      return request(app.getHttpServer())
        .post('/titles/movie/872585/rating')
        .set('X-Internal-Key', INTERNAL_KEY)
        .set('Authorization', 'Bearer not-a-real-token')
        .send({ score: 8 })
        .expect(401);
    });
  });

  describe('DELETE /titles/:type/:id/rating', () => {
    it('remove a avaliação e derruba o visto auto → 204', async () => {
      const token = await getToken();
      await post('/titles/movie/872585/rating', token, { score: 8 }).expect(200);

      await del('/titles/movie/872585/rating', token).expect(204);

      expect(ratings).toHaveLength(0);
      expect(watched).toHaveLength(0);
    });

    it('preserva o visto manual ao remover a avaliação', async () => {
      const token = await getToken();
      watched.push({
        userId: 1,
        tmdbId: 555,
        tmdbType: 'MOVIE',
        origem: 'manual',
      });
      await post('/titles/movie/555/rating', token, { score: 7 }).expect(200);

      await del('/titles/movie/555/rating', token).expect(204);

      expect(ratings).toHaveLength(0);
      expect(watched).toHaveLength(1);
      expect(watched[0].origem).toBe('manual');
    });

    it('idempotente: remover sem avaliação existente → 204', async () => {
      const token = await getToken();
      await del('/titles/movie/999/rating', token).expect(204);
    });

    it('401 sem Bearer', () => {
      return request(app.getHttpServer())
        .delete('/titles/movie/872585/rating')
        .set('X-Internal-Key', INTERNAL_KEY)
        .expect(401);
    });
  });
});
