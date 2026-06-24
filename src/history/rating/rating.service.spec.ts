import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { RatingService } from './rating.service';

describe('RatingService', () => {
  let service: RatingService;
  const prisma = {
    rating: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    watched: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const title = { tmdbId: 872585, tmdbType: 'MOVIE' as const };

  beforeEach(async () => {
    prisma.rating.upsert.mockResolvedValue({});
    prisma.rating.deleteMany.mockResolvedValue({ count: 1 });
    prisma.watched.findUnique.mockResolvedValue(null);
    prisma.watched.create.mockResolvedValue({});
    prisma.watched.deleteMany.mockResolvedValue({ count: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(RatingService);
  });

  afterEach(() => jest.clearAllMocks());

  it('avaliar sem visto cria/atualiza rating e marca visto-auto', async () => {
    await service.rate(7, title, 8);

    expect(prisma.rating.upsert).toHaveBeenCalledWith({
      where: {
        userId_tmdbId_tmdbType: {
          userId: 7,
          tmdbId: 872585,
          tmdbType: 'MOVIE',
        },
      },
      update: { score: 8 },
      create: {
        userId: 7,
        tmdbId: 872585,
        tmdbType: 'MOVIE',
        score: 8,
      },
    });
    expect(prisma.watched.create).toHaveBeenCalledWith({
      data: {
        userId: 7,
        tmdbId: 872585,
        tmdbType: 'MOVIE',
        origem: 'auto',
      },
    });
  });

  it('trocar nota atualiza rating sem criar outro watched', async () => {
    prisma.watched.findUnique.mockResolvedValue({ id: 10 });

    await service.rate(7, title, 6);

    expect(prisma.rating.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { score: 6 },
      }),
    );
    expect(prisma.watched.create).not.toHaveBeenCalled();
  });

  it('remover avaliação com visto-auto remove rating e watched', async () => {
    prisma.watched.findUnique.mockResolvedValue({ origem: 'auto' });

    await service.remove(7, title);

    expect(prisma.rating.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 7,
        tmdbId: 872585,
        tmdbType: 'MOVIE',
      },
    });
    expect(prisma.watched.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 7,
        tmdbId: 872585,
        tmdbType: 'MOVIE',
      },
    });
  });

  it('remover avaliação com visto-manual preserva watched', async () => {
    prisma.watched.findUnique.mockResolvedValue({ origem: 'manual' });

    await service.remove(7, title);

    expect(prisma.rating.deleteMany).toHaveBeenCalled();
    expect(prisma.watched.deleteMany).not.toHaveBeenCalled();
  });

  it('ownership usa o userId recebido nas queries', async () => {
    await service.rate(99, title, 10);

    expect(prisma.watched.findUnique).toHaveBeenCalledWith({
      where: {
        userId_tmdbId_tmdbType: {
          userId: 99,
          tmdbId: 872585,
          tmdbType: 'MOVIE',
        },
      },
      select: { id: true },
    });
  });
});
