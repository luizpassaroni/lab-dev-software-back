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
type FavoriteRow = CompositeKey & { id: number };

describe('Favorite E2E (BACK-21)', () => {
  let app: INestApplication;

  const users = new Map<string, StoredUser>();
  let nextUserId = 1;
  let nextFavoriteId = 1;
  let favorites: FavoriteRow[] = [];

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
    favorite: {
      upsert: jest.fn(({ where, create }) => {
        const k = where.userId_tmdbId_tmdbType as CompositeKey;
        const existing = favorites.find((f) => sameKey(f, k));
        if (existing) {
          return Promise.resolve({ ...existing });
        }
        const row: FavoriteRow = { id: nextFavoriteId, ...create };
        nextFavoriteId += 1;
        favorites.push(row);
        return Promise.resolve({ ...row });
      }),
      deleteMany: jest.fn(({ where }) => {
        const before = favorites.length;
        favorites = favorites.filter((f) => !matchesWhere(f, where));
        return Promise.resolve({ count: before - favorites.length });
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
    nextFavoriteId = 1;
    favorites = [];
    jest.clearAllMocks();
  });

  async function getToken(email = 'fan@example.com'): Promise<string> {
    await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-Internal-Key', INTERNAL_KEY)
      .send({ name: 'Fan', email, password: 'password123' });

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

  describe('POST /titles/:type/:id/favorite', () => {
    it('favorita sem nada antes → 200 + favorite: true', async () => {
      const token = await getToken();

      await post('/titles/movie/872585/favorite', token)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ favorite: true });
        });

      expect(favorites).toHaveLength(1);
      expect(favorites[0]).toMatchObject({ tmdbType: 'MOVIE', tmdbId: 872585 });
    });

    it('idempotente: favoritar duas vezes mantém uma linha', async () => {
      const token = await getToken();

      await post('/titles/tv/100/favorite', token).expect(200);
      await post('/titles/tv/100/favorite', token).expect(200);

      expect(favorites).toHaveLength(1);
      expect(favorites[0]).toMatchObject({ tmdbType: 'TV', tmdbId: 100 });
    });

    it('400 quando type é inválido', async () => {
      const token = await getToken();
      await post('/titles/banana/872585/favorite', token).expect(400);
    });

    it('400 quando id não é inteiro', async () => {
      const token = await getToken();
      await post('/titles/movie/abc/favorite', token).expect(400);
    });

    it('401 sem Bearer', () => {
      return request(app.getHttpServer())
        .post('/titles/movie/872585/favorite')
        .set('X-Internal-Key', INTERNAL_KEY)
        .expect(401);
    });
  });

  describe('DELETE /titles/:type/:id/favorite', () => {
    it('desfavorita → 204', async () => {
      const token = await getToken();
      await post('/titles/movie/872585/favorite', token).expect(200);

      await del('/titles/movie/872585/favorite', token).expect(204);

      expect(favorites).toHaveLength(0);
    });

    it('idempotente: desfavoritar o que não está favoritado → 204', async () => {
      const token = await getToken();
      await del('/titles/movie/999/favorite', token).expect(204);
    });

    it('401 sem Bearer', () => {
      return request(app.getHttpServer())
        .delete('/titles/movie/872585/favorite')
        .set('X-Internal-Key', INTERNAL_KEY)
        .expect(401);
    });
  });

  describe('Independência de Watched/Rating', () => {
    it('favoritar não cria Watched nem Rating', async () => {
      const token = await getToken();

      await post('/titles/movie/872585/favorite', token).expect(200);

      // o mock não possui chamadas a watched/rating nesse fluxo —
      // a ausência de side effects nessas tabelas é garantida pelo
      // FavoriteService.add nunca referenciar prisma.watched/prisma.rating.
      expect(favorites).toHaveLength(1);
    });
  });
});