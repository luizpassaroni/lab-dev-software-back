import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { WatchedService } from './watched.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TitleType } from '../../titles/dto/title-type.enum';

describe('WatchedService', () => {
  let service: WatchedService;

  const tx = {
    rating: { findUnique: jest.fn() },
    watched: { deleteMany: jest.fn() },
  };

  const mockPrismaService = {
    watched: { upsert: jest.fn() },
    $transaction: jest.fn((cb) => cb(tx)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchedService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WatchedService>(WatchedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mark', () => {
    it('marca visto manual (idempotente): upsert update+create com origem=manual', async () => {
      mockPrismaService.watched.upsert.mockResolvedValue({ origem: 'manual' });

      const res = await service.mark(1, TitleType.MOVIE, 872585);

      expect(mockPrismaService.watched.upsert).toHaveBeenCalledWith({
        where: {
          userId_tmdbId_tmdbType: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE' },
        },
        update: { origem: 'manual' },
        create: {
          userId: 1,
          tmdbId: 872585,
          tmdbType: 'MOVIE',
          origem: 'manual',
        },
      });
      expect(res).toEqual({ watched: { origem: 'manual' } });
    });

    it('promove visto auto → manual (update seta origem=manual)', async () => {
      mockPrismaService.watched.upsert.mockResolvedValue({ origem: 'manual' });

      const res = await service.mark(1, TitleType.TV, 100);

      expect(mockPrismaService.watched.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { origem: 'manual' } }),
      );
      expect(res.watched.origem).toBe('manual');
    });

    it('ownership: marca visto apenas para o userId recebido', async () => {
      mockPrismaService.watched.upsert.mockResolvedValue({ origem: 'manual' });

      await service.mark(42, TitleType.TV, 1396);

      expect(mockPrismaService.watched.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_tmdbId_tmdbType: {
              userId: 42,
              tmdbId: 1396,
              tmdbType: 'TV',
            },
          },
        }),
      );
    });
  });

  describe('unmark', () => {
    it('sem avaliação: remove o visto', async () => {
      tx.rating.findUnique.mockResolvedValue(null);
      tx.watched.deleteMany.mockResolvedValue({ count: 1 });

      await service.unmark(1, TitleType.MOVIE, 872585);

      expect(tx.rating.findUnique).toHaveBeenCalledWith({
        where: {
          userId_tmdbId_tmdbType: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE' },
        },
      });
      expect(tx.watched.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE' },
      });
    });

    it('com avaliação ativa: lança ConflictException e NÃO deleta o visto', async () => {
      tx.rating.findUnique.mockResolvedValue({ id: 9, score: 8 });

      await expect(
        service.unmark(1, TitleType.MOVIE, 872585),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(tx.watched.deleteMany).not.toHaveBeenCalled();
    });

    it('idempotente: sem visto nem avaliação não lança (count 0)', async () => {
      tx.rating.findUnique.mockResolvedValue(null);
      tx.watched.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.unmark(1, TitleType.MOVIE, 999),
      ).resolves.toBeUndefined();
    });

    it('ownership: consulta rating e remove watched pelo userId recebido', async () => {
      tx.rating.findUnique.mockResolvedValue(null);
      tx.watched.deleteMany.mockResolvedValue({ count: 1 });

      await service.unmark(42, TitleType.TV, 1396);

      expect(tx.rating.findUnique).toHaveBeenCalledWith({
        where: {
          userId_tmdbId_tmdbType: {
            userId: 42,
            tmdbId: 1396,
            tmdbType: 'TV',
          },
        },
      });
      expect(tx.watched.deleteMany).toHaveBeenCalledWith({
        where: { userId: 42, tmdbId: 1396, tmdbType: 'TV' },
      });
    });
  });
});
