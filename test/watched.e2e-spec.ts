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

describe('Watched E2E (BACK-21)', () => {
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
      findUnique: jest.fn(({ where }) => {
        const k = where.userId_tmdbId_tmdbType as CompositeKey;
        return Promise.resolve(ratings.find((r) => sameKey(r, k)) ?? null);
      }),
    },
    watched: {
      upsert: jest.fn(({ where, update, create }) => {
        const k = where.userId_tmdbId_tmdbType as CompositeKey;
        const existing = watched.find((w) => sameKey(w, k));
        if (existing) {
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

  async function getToken(email = 'watcher@example.com'): Promise<string> {
    await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-Internal-Key', INTERNAL_KEY)
      .send({ name: 'Watcher', email, password: 'password123' });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Internal-Key', INTERNAL_KEY)
      .send({ email, password: 'password123' });

    return login.body.access_token as string;
  }

  const post = (path: string, token: string) =>
    request(app.getHttpServer())
      .post(path)
      .set('X-Internal-Key', INTERNAL_KEY)
      .set('Authorization', `Bearer ${token}`);

  const del = (path: string, token: string) =>
    request(app.getHttpServer())
      .delete(path)
      .set('X-Internal-Key', INTERNAL_KEY)
      .set('Authorization', `Bearer ${token}`);

  describe('POST /titles/:type/:id/watched', () => {
    it('marca visto sem nada antes → 200 + origem=manual', async () => {
      const token = await getToken();

      await post('/titles/movie/872585/watched', token)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ watched: { origem: 'manual' } });
        });

      expect(watched).toHaveLength(1);
      expect(watched[0]).toMatchObject({ tmdbType: 'MOVIE', origem: 'manual' });
    });

    it('promove visto auto → manual (sem duplicar linha)', async () => {
      const token = await getToken();
      watched.push({
        userId: 1,
        tmdbId: 872585,
        tmdbType: 'MOVIE',
        origem: 'auto',
      });

      await post('/titles/movie/872585/watched', token)
        .expect(200)
        .expect((res) => expect(res.body.watched.origem).toBe('manual'));

      expect(watched).toHaveLength(1);
      expect(watched[0].origem).toBe('manual');
    });

    it('idempotente: marcar duas vezes mantém uma linha manual', async () => {
      const token = await getToken();

      await post('/titles/tv/100/watched', token).expect(200);
      await post('/titles/tv/100/watched', token).expect(200);

      expect(watched).toHaveLength(1);
      expect(watched[0]).toMatchObject({ tmdbType: 'TV', origem: 'manual' });
    });

    it('400 quando type é inválido', async () => {
      const token = await getToken();
      await post('/titles/banana/872585/watched', token).expect(400);
    });

    it('400 quando id não é inteiro', async () => {
      const token = await getToken();
      await post('/titles/movie/abc/watched', token).expect(400);
    });

    it('401 sem Bearer', () => {
      return request(app.getHttpServer())
        .post('/titles/movie/872585/watched')
        .set('X-Internal-Key', INTERNAL_KEY)
        .expect(401);
    });
  });

  describe('DELETE /titles/:type/:id/watched', () => {
    it('desmarca o visto sem avaliação → 204', async () => {
      const token = await getToken();
      await post('/titles/movie/872585/watched', token).expect(200);

      await del('/titles/movie/872585/watched', token).expect(204);

      expect(watched).toHaveLength(0);
    });

    it('409 quando há avaliação ativa, sem remover o visto', async () => {
      const token = await getToken();
      ratings.push({
        userId: 1,
        tmdbId: 872585,
        tmdbType: 'MOVIE',
        score: 8,
      });
      watched.push({
        userId: 1,
        tmdbId: 872585,
        tmdbType: 'MOVIE',
        origem: 'manual',
      });

      await del('/titles/movie/872585/watched', token).expect(409);

      expect(watched).toHaveLength(1);
    });

    it('idempotente: sem visto nem avaliação → 204', async () => {
      const token = await getToken();
      await del('/titles/movie/999/watched', token).expect(204);
    });

    it('401 sem Bearer', () => {
      return request(app.getHttpServer())
        .delete('/titles/movie/872585/watched')
        .set('X-Internal-Key', INTERNAL_KEY)
        .expect(401);
    });
  });
});
