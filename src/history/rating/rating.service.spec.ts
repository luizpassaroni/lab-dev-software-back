import { Test, TestingModule } from '@nestjs/testing';
import { RatingService } from './rating.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TitleType } from '../../titles/dto/title-type.enum';

describe('RatingService', () => {
  let service: RatingService;

  const tx = {
    rating: { upsert: jest.fn(), deleteMany: jest.fn() },
    watched: { upsert: jest.fn(), deleteMany: jest.fn() },
  };

  const mockPrismaService = {
    // Executa a callback da transação com o client transacional mockado.
    $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    it('avalia sem visto prévio: upsert da nota + cria Watched origem=auto', async () => {
      tx.rating.upsert.mockResolvedValue({ score: 8 });
      tx.watched.upsert.mockResolvedValue({ origem: 'auto' });

      const res = await service.set(1, TitleType.MOVIE, 872585, 8);

      expect(tx.rating.upsert).toHaveBeenCalledWith({
        where: {
          userId_tmdbId_tmdbType: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE' },
        },
        update: { score: 8 },
        create: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE', score: 8 },
      });
      expect(tx.watched.upsert).toHaveBeenCalledWith({
        where: {
          userId_tmdbId_tmdbType: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE' },
        },
        update: {},
        create: {
          userId: 1,
          tmdbId: 872585,
          tmdbType: 'MOVIE',
          origem: 'auto',
        },
      });
      expect(res).toEqual({ rating: { score: 8 }, watched: { origem: 'auto' } });
    });

    it('trocar a nota: upsert atualiza a mesma linha (update), sem duplicar', async () => {
      tx.rating.upsert.mockResolvedValue({ score: 6 });
      tx.watched.upsert.mockResolvedValue({ origem: 'auto' });

      await service.set(1, TitleType.MOVIE, 872585, 6);

      expect(tx.rating.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { score: 6 } }),
      );
    });

    it('visto manual preexistente é preservado: update vazio e origem segue manual', async () => {
      tx.rating.upsert.mockResolvedValue({ score: 9 });
      tx.watched.upsert.mockResolvedValue({ origem: 'manual' });

      const res = await service.set(1, TitleType.TV, 100, 9);

      expect(tx.watched.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: {} }),
      );
      expect(res.watched.origem).toBe('manual');
    });

    it('traduz TitleType.TV → tmdbType "TV"', async () => {
      tx.rating.upsert.mockResolvedValue({ score: 5 });
      tx.watched.upsert.mockResolvedValue({ origem: 'auto' });

      await service.set(2, TitleType.TV, 100, 5);

      expect(tx.rating.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_tmdbId_tmdbType: { userId: 2, tmdbId: 100, tmdbType: 'TV' },
          },
        }),
      );
    });

    it('ownership: usa o userId recebido nas queries de rating e watched', async () => {
      tx.rating.upsert.mockResolvedValue({ score: 10 });
      tx.watched.upsert.mockResolvedValue({ origem: 'auto' });

      await service.set(99, TitleType.MOVIE, 872585, 10);

      expect(tx.rating.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_tmdbId_tmdbType: {
              userId: 99,
              tmdbId: 872585,
              tmdbType: 'MOVIE',
            },
          },
        }),
      );
      expect(tx.watched.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_tmdbId_tmdbType: {
              userId: 99,
              tmdbId: 872585,
              tmdbType: 'MOVIE',
            },
          },
        }),
      );
    });
  });

  describe('remove', () => {
    it('remove a avaliação e derruba apenas o visto auto', async () => {
      tx.rating.deleteMany.mockResolvedValue({ count: 1 });
      tx.watched.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove(1, TitleType.MOVIE, 872585);

      expect(tx.rating.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE' },
      });
      expect(tx.watched.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE', origem: 'auto' },
      });
    });

    it('idempotente: remover o que não existe não lança (count 0)', async () => {
      tx.rating.deleteMany.mockResolvedValue({ count: 0 });
      tx.watched.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.remove(1, TitleType.MOVIE, 999),
      ).resolves.toBeUndefined();
    });

    it('ownership: remove avaliação e visto-auto apenas do userId recebido', async () => {
      tx.rating.deleteMany.mockResolvedValue({ count: 1 });
      tx.watched.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove(42, TitleType.TV, 1396);

      expect(tx.rating.deleteMany).toHaveBeenCalledWith({
        where: { userId: 42, tmdbId: 1396, tmdbType: 'TV' },
      });
      expect(tx.watched.deleteMany).toHaveBeenCalledWith({
        where: { userId: 42, tmdbId: 1396, tmdbType: 'TV', origem: 'auto' },
      });
    });
  });
});
