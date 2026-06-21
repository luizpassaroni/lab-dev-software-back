import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteService } from './favorite.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TitleType } from '../../titles/dto/title-type.enum';

describe('FavoriteService', () => {
  let service: FavoriteService;

  const mockPrismaService = {
    favorite: { upsert: jest.fn(), deleteMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FavoriteService>(FavoriteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('add', () => {
    it('favorita (idempotente): upsert com update vazio e create completo', async () => {
      mockPrismaService.favorite.upsert.mockResolvedValue({
        id: 1,
        userId: 1,
        tmdbId: 872585,
        tmdbType: 'MOVIE',
      });

      await service.add(1, TitleType.MOVIE, 872585);

      expect(mockPrismaService.favorite.upsert).toHaveBeenCalledWith({
        where: {
          userId_tmdbId_tmdbType: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE' },
        },
        update: {},
        create: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE' },
      });
    });

    it('repetir não duplica: update permanece {} (no-op)', async () => {
      mockPrismaService.favorite.upsert.mockResolvedValue({
        id: 1,
        userId: 1,
        tmdbId: 100,
        tmdbType: 'TV',
      });

      await service.add(1, TitleType.TV, 100);

      expect(mockPrismaService.favorite.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: {} }),
      );
    });
  });

  describe('remove', () => {
    it('desfavorita: deleteMany com a chave composta', async () => {
      mockPrismaService.favorite.deleteMany.mockResolvedValue({ count: 1 });

      await service.remove(1, TitleType.MOVIE, 872585);

      expect(mockPrismaService.favorite.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1, tmdbId: 872585, tmdbType: 'MOVIE' },
      });
    });

    it('idempotente: remover o que não está favoritado não lança (count 0)', async () => {
      mockPrismaService.favorite.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.remove(1, TitleType.MOVIE, 999),
      ).resolves.toBeUndefined();
    });
  });
});