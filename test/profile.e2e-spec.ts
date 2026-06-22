import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TmdbType } from '@prisma/client';
import { INTERNAL_KEY } from './setup-e2e';

type StoredUser = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

describe('Profile E2E (BACK-23)', () => {
  let app: INestApplication;

  const users = new Map<string, StoredUser>();
  let nextUserId = 1;

  const watched: {
    id: number;
    userId: number;
    tmdbId: number;
    tmdbType: TmdbType;
    origem: string;
    watchedAt: Date;
  }[] = [];

  const ratings: {
    id: number;
    userId: number;
    tmdbId: number;
    tmdbType: TmdbType;
    score: number;
    createdAt: Date;
  }[] = [];

  const favorites: {
    id: number;
    userId: number;
    tmdbId: number;
    tmdbType: TmdbType;
    createdAt: Date;
  }[] = [];

  const mockCard = (tmdbId: number, tmdbType: string) => ({
    tmdbId,
    tmdbType,
    title: `Título ${tmdbId}`,
    year: 2023,
    posterUrl: `https://image.tmdb.org/t/p/w500/${tmdbId}.jpg`,
  });

  const prismaMock = {
    user: {
      create: jest.fn(({ data }) => {
        const user: StoredUser = {
          id: nextUserId++,
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          createdAt: new Date(),
        };
        users.set(user.email, user);
        return Promise.resolve(user);
      }),
      findUnique: jest.fn(({ where }) => {
        if (where.email) return Promise.resolve(users.get(where.email) ?? null);
        for (const u of users.values()) {
          if (u.id === where.id) return Promise.resolve(u);
        }
        return Promise.resolve(null);
      }),
    },
    watched: {
      count: jest.fn(({ where }) =>
        Promise.resolve(watched.filter((r) => r.userId === where.userId).length),
      ),
      findMany: jest.fn(({ where, orderBy: _o, take }) =>
        Promise.resolve(
          watched
            .filter((r) => r.userId === where.userId)
            .sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime())
            .slice(0, take),
        ),
      ),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    rating: {
      count: jest.fn(({ where }) =>
        Promise.resolve(ratings.filter((r) => r.userId === where.userId).length),
      ),
      findMany: jest.fn(({ where, orderBy: _o, take }) =>
        Promise.resolve(
          ratings
            .filter((r) => r.userId === where.userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, take),
        ),
      ),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    favorite: {
      count: jest.fn(({ where }) =>
        Promise.resolve(favorites.filter((r) => r.userId === where.userId).length),
      ),
      findMany: jest.fn(({ where, orderBy: _o, take }) =>
        Promise.resolve(
          favorites
            .filter((r) => r.userId === where.userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, take),
        ),
      ),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const titlesMock = {
    getCardSummary: jest.fn((type: string, id: number) =>
      Promise.resolve(mockCard(id, type === 'movie' ? 'MOVIE' : 'TV')),
    ),
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
    watched.length = 0;
    ratings.length = 0;
    favorites.length = 0;
    jest.clearAllMocks();

    // Restaurar mocks após clearAllMocks
    prismaMock.user.create.mockImplementation(({ data }) => {
      const user: StoredUser = {
        id: nextUserId++,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        createdAt: new Date(),
      };
      users.set(user.email, user);
      return Promise.resolve(user);
    });
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.email) return Promise.resolve(users.get(where.email) ?? null);
      for (const u of users.values()) {
        if (u.id === where.id) return Promise.resolve(u);
      }
      return Promise.resolve(null);
    });
    prismaMock.watched.count.mockImplementation(({ where }) =>
      Promise.resolve(watched.filter((r) => r.userId === where.userId).length),
    );
    prismaMock.watched.findMany.mockImplementation(({ where, take }) =>
      Promise.resolve(
        watched
          .filter((r) => r.userId === where.userId)
          .sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime())
          .slice(0, take),
      ),
    );
    prismaMock.rating.count.mockImplementation(({ where }) =>
      Promise.resolve(ratings.filter((r) => r.userId === where.userId).length),
    );
    prismaMock.rating.findMany.mockImplementation(({ where, take }) =>
      Promise.resolve(
        ratings
          .filter((r) => r.userId === where.userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, take),
      ),
    );
    prismaMock.favorite.count.mockImplementation(({ where }) =>
      Promise.resolve(favorites.filter((r) => r.userId === where.userId).length),
    );
    prismaMock.favorite.findMany.mockImplementation(({ where, take }) =>
      Promise.resolve(
        favorites
          .filter((r) => r.userId === where.userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, take),
      ),
    );
    titlesMock.getCardSummary.mockImplementation((type: string, id: number) =>
      Promise.resolve(mockCard(id, type === 'movie' ? 'MOVIE' : 'TV')),
    );
  });

  async function getToken(email = 'user@example.com'): Promise<{ token: string; userId: number }> {
    await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-Internal-Key', INTERNAL_KEY)
      .send({ name: 'User', email, password: 'password123' });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Internal-Key', INTERNAL_KEY)
      .send({ email, password: 'password123' });

    return { token: login.body.access_token as string, userId: 1 };
  }

  it('sem histórico → totais 0 e listas []', async () => {
    const { token } = await getToken();

    const res = await request(app.getHttpServer())
      .get('/users/me/profile')
      .set('X-Internal-Key', INTERNAL_KEY)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.totais).toEqual({ vistos: 0, avaliados: 0, favoritos: 0 });
    expect(res.body.vistos).toEqual([]);
    expect(res.body.avaliados).toEqual([]);
    expect(res.body.favoritos).toEqual([]);
  });

  it('com histórico → totais e listas corretos', async () => {
    const { token } = await getToken();

    watched.push({
      id: 1, userId: 1, tmdbId: 872585,
      tmdbType: TmdbType.MOVIE, origem: 'auto', watchedAt: new Date(),
    });
    watched.push({
      id: 2, userId: 1, tmdbId: 1396,
      tmdbType: TmdbType.TV, origem: 'manual', watchedAt: new Date(),
    });
    ratings.push({
      id: 1, userId: 1, tmdbId: 872585,
      tmdbType: TmdbType.MOVIE, score: 9, createdAt: new Date(),
    });
    favorites.push({
      id: 1, userId: 1, tmdbId: 27205,
      tmdbType: TmdbType.MOVIE, createdAt: new Date(),
    });

    const res = await request(app.getHttpServer())
      .get('/users/me/profile')
      .set('X-Internal-Key', INTERNAL_KEY)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.totais).toEqual({ vistos: 2, avaliados: 1, favoritos: 1 });
    expect(res.body.vistos).toHaveLength(2);
    expect(res.body.avaliados).toHaveLength(1);
    expect(res.body.avaliados[0]).toMatchObject({ score: 9 });
    expect(res.body.favoritos).toHaveLength(1);
    expect(res.body.vistos[0]).toHaveProperty('posterUrl');
    expect(res.body.vistos[0]).toHaveProperty('title');
    expect(res.body.vistos[0]).toHaveProperty('year');
  });

  it('401 sem Bearer', async () => {
    await request(app.getHttpServer())
      .get('/users/me/profile')
      .set('X-Internal-Key', INTERNAL_KEY)
      .expect(401);
  });
});