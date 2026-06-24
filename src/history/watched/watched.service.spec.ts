import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { WatchedService } from './watched.service';

describe('WatchedService', () => {
  let service: WatchedService;
  const prisma = {
    watched: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    rating: {
      findUnique: jest.fn(),
    },
  };
  const title = { tmdbId: 1396, tmdbType: 'TV' as const };

  beforeEach(async () => {
    prisma.watched.upsert.mockResolvedValue({});
    prisma.watched.deleteMany.mockResolvedValue({ count: 1 });
    prisma.rating.findUnique.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchedService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(WatchedService);
  });

  afterEach(() => jest.clearAllMocks());

  it('mark upserta watched com origem manual', async () => {
    await service.mark(7, title);

    expect(prisma.watched.upsert).toHaveBeenCalledWith({
      where: {
        userId_tmdbId_tmdbType: {
          userId: 7,
          tmdbId: 1396,
          tmdbType: 'TV',
        },
      },
      update: { origem: 'manual' },
      create: {
        userId: 7,
        tmdbId: 1396,
        tmdbType: 'TV',
        origem: 'manual',
      },
    });
  });

  it('unmark com rating existente lança ConflictException', async () => {
    prisma.rating.findUnique.mockResolvedValue({ id: 123 });

    await expect(service.unmark(7, title)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.watched.deleteMany).not.toHaveBeenCalled();
  });

  it('unmark sem rating remove watched de forma idempotente', async () => {
    await service.unmark(7, title);

    expect(prisma.watched.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 7,
        tmdbId: 1396,
        tmdbType: 'TV',
      },
    });
  });

  it('ownership usa o userId recebido ao consultar rating', async () => {
    await service.unmark(42, title);

    expect(prisma.rating.findUnique).toHaveBeenCalledWith({
      where: {
        userId_tmdbId_tmdbType: {
          userId: 42,
          tmdbId: 1396,
          tmdbType: 'TV',
        },
      },
      select: { id: true },
    });
  });
});
