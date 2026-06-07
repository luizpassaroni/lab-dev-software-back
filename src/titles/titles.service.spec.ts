import { BadGatewayException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { TitlesService } from './titles.service';
import { TmdbHttpService } from './tmdb-http.service';

describe('TitlesService', () => {
  let service: TitlesService;
  const mockTmdb = { get: jest.fn() };
  const store = new Map<string, unknown>();
  const mockCache = {
    get: jest.fn((k: string) => Promise.resolve(store.get(k))),
    set: jest.fn((k: string, v: unknown) => {
      store.set(k, v);
      return Promise.resolve();
    }),
  };

  const fixture = {
    page: 1,
    total_pages: 1,
    total_results: 3,
    results: [
      { id: 1, media_type: 'person', name: 'Cillian Murphy' },
      {
        id: 872585,
        media_type: 'movie',
        title: 'Oppenheimer',
        release_date: '2023-07-19',
        poster_path: '/abc.jpg',
      },
      {
        id: 100,
        media_type: 'tv',
        name: 'Chernobyl',
        first_air_date: '2019-05-06',
        poster_path: null,
      },
    ],
  };

  beforeEach(async () => {
    store.clear();
    mockTmdb.get.mockResolvedValue(fixture);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TitlesService,
        { provide: TmdbHttpService, useValue: mockTmdb },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();
    service = module.get<TitlesService>(TitlesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('busca OK: filtra pessoa, normaliza filme e série com badge e tmdbType', async () => {
    const res = await service.search('oppenheimer', 1);
    expect(res.results).toHaveLength(2);
    expect(res.results[0]).toMatchObject({
      tmdbId: 872585,
      tmdbType: 'MOVIE',
      title: 'Oppenheimer',
      year: 2023,
      posterUrl: 'https://image.tmdb.org/t/p/w500/abc.jpg',
      badge: 'Filme',
    });
    expect(res.results[1]).toMatchObject({
      tmdbType: 'TV',
      badge: 'Série',
      year: 2019,
      posterUrl: null,
    });
    expect(res).toMatchObject({ page: 1, totalPages: 1, hasMore: false });
  });

  it('cache hit: 2ª chamada (q,page) idêntica não bate na TMDB', async () => {
    await service.search('oppenheimer', 1);
    await service.search('oppenheimer', 1);
    expect(mockTmdb.get).toHaveBeenCalledTimes(1);
  });

  it('erro da TMDB → 502 tratado, sem crash', async () => {
    mockTmdb.get.mockRejectedValueOnce(new Error('network'));
    await expect(service.search('x', 1)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
