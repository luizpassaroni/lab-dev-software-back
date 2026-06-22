import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TitlesService } from '../../titles/titles.service';
import { TmdbType } from '@prisma/client';

describe('ProfileService', () => {
  let service: ProfileService;

  const mockPrisma = {
    watched: { count: jest.fn(), findMany: jest.fn() },
    rating: { count: jest.fn(), findMany: jest.fn() },
    favorite: { count: jest.fn(), findMany: jest.fn() },
  };

  const mockTitlesService = {
    getCardSummary: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TitlesService, useValue: mockTitlesService },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('retorna totais e listas corretamente', async () => {
      mockPrisma.watched.count.mockResolvedValue(2);
      mockPrisma.rating.count.mockResolvedValue(1);
      mockPrisma.favorite.count.mockResolvedValue(1);

      mockPrisma.watched.findMany.mockResolvedValue([
        { tmdbId: 872585, tmdbType: TmdbType.MOVIE },
        { tmdbId: 1396, tmdbType: TmdbType.TV },
      ]);
      mockPrisma.rating.findMany.mockResolvedValue([
        { tmdbId: 872585, tmdbType: TmdbType.MOVIE, score: 9 },
      ]);
      mockPrisma.favorite.findMany.mockResolvedValue([
        { tmdbId: 27205, tmdbType: TmdbType.MOVIE },
      ]);

      mockTitlesService.getCardSummary.mockImplementation(
        (type: string, id: number) =>
          Promise.resolve({
            tmdbId: id,
            tmdbType: type === 'movie' ? 'MOVIE' : 'TV',
            title: 'Título Teste',
            year: 2023,
            posterUrl: 'https://image.tmdb.org/t/p/w500/test.jpg',
          }),
      );

      const result = await service.get(1);

      expect(result.totais).toEqual({ vistos: 2, avaliados: 1, favoritos: 1 });
      expect(result.vistos).toHaveLength(2);
      expect(result.avaliados).toHaveLength(1);
      expect(result.avaliados[0]).toMatchObject({ score: 9 });
      expect(result.favoritos).toHaveLength(1);
    });

    it('sem histórico → totais 0 e listas []', async () => {
      mockPrisma.watched.count.mockResolvedValue(0);
      mockPrisma.rating.count.mockResolvedValue(0);
      mockPrisma.favorite.count.mockResolvedValue(0);
      mockPrisma.watched.findMany.mockResolvedValue([]);
      mockPrisma.rating.findMany.mockResolvedValue([]);
      mockPrisma.favorite.findMany.mockResolvedValue([]);

      const result = await service.get(1);

      expect(result.totais).toEqual({ vistos: 0, avaliados: 0, favoritos: 0 });
      expect(result.vistos).toEqual([]);
      expect(result.avaliados).toEqual([]);
      expect(result.favoritos).toEqual([]);
    });

    it('limite de 30 itens por lista (orderBy desc, take 30)', async () => {
      mockPrisma.watched.count.mockResolvedValue(0);
      mockPrisma.rating.count.mockResolvedValue(0);
      mockPrisma.favorite.count.mockResolvedValue(0);
      mockPrisma.watched.findMany.mockResolvedValue([]);
      mockPrisma.rating.findMany.mockResolvedValue([]);
      mockPrisma.favorite.findMany.mockResolvedValue([]);

      await service.get(1);

      expect(mockPrisma.watched.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 30, orderBy: { watchedAt: 'desc' } }),
      );
      expect(mockPrisma.rating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 30, orderBy: { createdAt: 'desc' } }),
      );
      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 30, orderBy: { createdAt: 'desc' } }),
      );
    });

    it('getCardSummary falha (TMDB fora) → retorna fallback sem 500', async () => {
      mockPrisma.watched.count.mockResolvedValue(1);
      mockPrisma.rating.count.mockResolvedValue(0);
      mockPrisma.favorite.count.mockResolvedValue(0);
      mockPrisma.watched.findMany.mockResolvedValue([
        { tmdbId: 999, tmdbType: TmdbType.MOVIE },
      ]);
      mockPrisma.rating.findMany.mockResolvedValue([]);
      mockPrisma.favorite.findMany.mockResolvedValue([]);

      mockTitlesService.getCardSummary.mockResolvedValue({
        tmdbId: 999,
        tmdbType: 'MOVIE',
        title: '',
        year: null,
        posterUrl: null,
      });

      const result = await service.get(1);

      expect(result.vistos).toHaveLength(1);
      expect(result.vistos[0]).toMatchObject({ tmdbId: 999, title: '' });
    });
  });
});