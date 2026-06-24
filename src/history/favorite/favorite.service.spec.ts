import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { FavoriteService } from './favorite.service';

describe('FavoriteService', () => {
  let service: FavoriteService;
  const prisma = {
    favorite: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    rating: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    watched: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const title = { tmdbId: 872585, tmdbType: 'MOVIE' as const };

  beforeEach(async () => {
    prisma.favorite.upsert.mockResolvedValue({});
    prisma.favorite.deleteMany.mockResolvedValue({ count: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(FavoriteService);
  });

  afterEach(() => jest.clearAllMocks());

  it('add é idempotente e não toca rating/watched', async () => {
    await service.add(7, title);

    expect(prisma.favorite.upsert).toHaveBeenCalledWith({
      where: {
        userId_tmdbId_tmdbType: {
          userId: 7,
          tmdbId: 872585,
          tmdbType: 'MOVIE',
        },
      },
      update: {},
      create: {
        userId: 7,
        tmdbId: 872585,
        tmdbType: 'MOVIE',
      },
    });
    expect(prisma.rating.upsert).not.toHaveBeenCalled();
    expect(prisma.watched.upsert).not.toHaveBeenCalled();
  });

  it('remove é idempotente e não toca rating/watched', async () => {
    await service.remove(7, title);

    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 7,
        tmdbId: 872585,
        tmdbType: 'MOVIE',
      },
    });
    expect(prisma.rating.deleteMany).not.toHaveBeenCalled();
    expect(prisma.watched.deleteMany).not.toHaveBeenCalled();
  });

  it('ownership usa o userId recebido nas queries', async () => {
    await service.add(88, title);

    expect(prisma.favorite.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_tmdbId_tmdbType: {
            userId: 88,
            tmdbId: 872585,
            tmdbType: 'MOVIE',
          },
        },
      }),
    );
  });
});
