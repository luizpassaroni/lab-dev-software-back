import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { TitlesService } from './titles.service';
import { TmdbHttpService } from './tmdb-http.service';
import { TitleType } from './dto/title-type.enum';

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

  describe('getGenres', () => {
    const movieGenres = {
      genres: [
        { id: 28, name: 'Ação' },
        { id: 35, name: 'Comédia' },
      ],
    };
    const tvGenres = {
      genres: [
        { id: 35, name: 'Comédia' },
        { id: 18, name: 'Drama' },
      ],
    };

    it('combina, deduplica por id, traduz o campo e ordena por nome', async () => {
      mockTmdb.get.mockImplementation((path: string) =>
        Promise.resolve(path.includes('/movie/') ? movieGenres : tvGenres),
      );

      const result = await service.getGenres();

      expect(result).toEqual([
        { id: 28, nome: 'Ação' },
        { id: 35, nome: 'Comédia' },
        { id: 18, nome: 'Drama' },
      ]);
      expect(mockTmdb.get).toHaveBeenCalledWith('/genre/movie/list');
      expect(mockTmdb.get).toHaveBeenCalledWith('/genre/tv/list');
      expect(mockCache.set).toHaveBeenCalledWith('genres:all', result);
    });

    it('cache hit: 2ª chamada não rebate na TMDB', async () => {
      mockTmdb.get.mockImplementation((path: string) =>
        Promise.resolve(path.includes('/movie/') ? movieGenres : tvGenres),
      );

      await service.getGenres();
      await service.getGenres();

      expect(mockTmdb.get).toHaveBeenCalledTimes(2);
    });

    it('erro da TMDB → 502 tratado', async () => {
      mockTmdb.get.mockRejectedValueOnce(new Error('network'));

      await expect(service.getGenres()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });

  describe('discover', () => {
    const movies = {
      page: 2,
      total_pages: 5,
      total_results: 1,
      results: [
        {
          id: 1,
          title: 'Filme de ação',
          release_date: '2024-01-10',
          poster_path: '/movie.jpg',
        },
      ],
    };
    const tv = {
      page: 2,
      total_pages: 3,
      total_results: 1,
      results: [
        {
          id: 2,
          name: 'Série de ação',
          first_air_date: '2020-05-20',
          poster_path: null,
        },
      ],
    };

    const mockDiscoverEndpoints = () => {
      mockTmdb.get.mockImplementation((path: string) =>
        Promise.resolve(path.endsWith('/movie') ? movies : tv),
      );
    };

    it('combina filmes e séries no shape da busca e usa a maior paginação', async () => {
      mockDiscoverEndpoints();

      const result = await service.discover(28, 2);

      expect(result).toMatchObject({
        page: 2,
        totalPages: 5,
        hasMore: true,
        results: [
          {
            tmdbId: 1,
            tmdbType: 'MOVIE',
            title: 'Filme de ação',
            year: 2024,
            posterUrl: 'https://image.tmdb.org/t/p/w500/movie.jpg',
            badge: 'Filme',
          },
          {
            tmdbId: 2,
            tmdbType: 'TV',
            title: 'Série de ação',
            year: 2020,
            posterUrl: null,
            badge: 'Série',
          },
        ],
      });
      expect(mockTmdb.get).toHaveBeenCalledWith('/discover/movie', {
        with_genres: 28,
        page: 2,
      });
      expect(mockTmdb.get).toHaveBeenCalledWith('/discover/tv', {
        with_genres: 28,
        page: 2,
      });
      expect(mockCache.set).toHaveBeenCalledWith(
        'discover:28:2',
        result,
        3_600_000,
      );
    });

    it('hasMore é false quando ambas as fontes chegaram ao fim', async () => {
      mockTmdb.get.mockResolvedValue({
        ...movies,
        page: 5,
        total_pages: 5,
      });

      const result = await service.discover(28, 5);

      expect(result).toMatchObject({
        page: 5,
        totalPages: 5,
        hasMore: false,
      });
    });

    it('cache hit: 2ª chamada não rebate na TMDB', async () => {
      mockDiscoverEndpoints();

      await service.discover(28, 2);
      await service.discover(28, 2);

      expect(mockTmdb.get).toHaveBeenCalledTimes(2);
    });

    it('erro da TMDB → 502 tratado', async () => {
      mockTmdb.get.mockRejectedValueOnce(new Error('network'));

      await expect(service.discover(28, 1)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });

  describe('getDetail', () => {
    const movieCast = [
      { name: 'A10', character: 'c10', profile_path: '/10.jpg', order: 10 },
      { name: 'A3', character: 'c3', profile_path: null, order: 3 },
      {
        name: 'Cillian Murphy',
        character: 'J. R. Oppenheimer',
        profile_path: '/cm.jpg',
        order: 0,
      },
      { name: 'A11', character: 'c11', profile_path: '/11.jpg', order: 11 },
      { name: 'A1', character: 'c1', profile_path: '/1.jpg', order: 1 },
      { name: 'A2', character: 'c2', profile_path: '/2.jpg', order: 2 },
      { name: 'A4', character: 'c4', profile_path: '/4.jpg', order: 4 },
      { name: 'A5', character: 'c5', profile_path: '/5.jpg', order: 5 },
      { name: 'A6', character: 'c6', profile_path: '/6.jpg', order: 6 },
      { name: 'A7', character: 'c7', profile_path: '/7.jpg', order: 7 },
      { name: 'A8', character: 'c8', profile_path: '/8.jpg', order: 8 },
      { name: 'A9', character: 'c9', profile_path: '/9.jpg', order: 9 },
    ];

    const movieDetails = {
      id: 872585,
      title: 'Oppenheimer',
      overview: 'Vida do físico J. R. Oppenheimer.',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      vote_average: 8.099,
      genres: [
        { id: 18, name: 'Drama' },
        { id: 36, name: 'História' },
      ],
      release_date: '2023-07-19',
      runtime: 180,
      credits: { cast: movieCast },
    };

    const tvDetails = {
      id: 1396,
      name: 'Breaking Bad',
      overview: 'Professor de química vira fabricante de metanfetamina.',
      poster_path: '/tvposter.jpg',
      backdrop_path: '/tvback.jpg',
      vote_average: 8.9,
      genres: [{ id: 18, name: 'Drama' }],
      first_air_date: '2008-01-20',
      number_of_seasons: 5,
      credits: { cast: [] },
    };

    const providersBR = {
      results: {
        BR: {
          flatrate: [
            {
              provider_id: 8,
              provider_name: 'Netflix',
              logo_path: '/nf.jpg',
              display_priority: 3,
            },
            {
              provider_id: 119,
              provider_name: 'Amazon Prime Video',
              logo_path: '/pv.jpg',
              display_priority: 1,
            },
            {
              provider_id: 384,
              provider_name: 'HBO Max',
              logo_path: null,
              display_priority: 2,
            },
          ],
          rent: [
            {
              provider_id: 2,
              provider_name: 'Apple TV',
              logo_path: '/atv.jpg',
              display_priority: 5,
            },
          ],
          buy: [],
        },
        US: {
          flatrate: [
            {
              provider_id: 9,
              provider_name: 'Hulu',
              logo_path: '/hulu.jpg',
              display_priority: 1,
            },
          ],
        },
      },
    };

    const providersNoBR = {
      results: {
        US: {
          flatrate: [
            {
              provider_id: 9,
              provider_name: 'Hulu',
              logo_path: '/hulu.jpg',
              display_priority: 1,
            },
          ],
        },
      },
    };

    const mockEndpoints = (detail: unknown, providers: unknown) => {
      mockTmdb.get.mockImplementation((path: string) =>
        Promise.resolve(path.endsWith('/watch/providers') ? providers : detail),
      );
    };

    it('ficha de filme completa: mapeia todos os campos da issue', async () => {
      mockEndpoints(movieDetails, providersBR);
      const res = await service.getDetail(TitleType.MOVIE, 872585);
      expect(res).toMatchObject({
        tmdbId: 872585,
        tmdbType: 'MOVIE',
        title: 'Oppenheimer',
        year: 2023,
        overview: 'Vida do físico J. R. Oppenheimer.',
        posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
        runtime: 180,
        seasons: null,
        tmdbRating: 8.1,
        genres: ['Drama', 'História'],
      });
    });

    it('ficha de série: seasons preenchido e runtime null', async () => {
      mockEndpoints(tvDetails, providersNoBR);
      const res = await service.getDetail(TitleType.TV, 1396);
      expect(res).toMatchObject({
        tmdbType: 'TV',
        title: 'Breaking Bad',
        year: 2008,
        runtime: null,
        seasons: 5,
      });
    });

    it('arredonda o rating da TMDB para 1 casa decimal', async () => {
      mockEndpoints(movieDetails, providersBR);
      const res = await service.getDetail(TitleType.MOVIE, 872585);
      expect(res.tmdbRating).toBe(8.1);
    });

    it('vote_average 0 permanece 0', async () => {
      mockEndpoints({ ...movieDetails, vote_average: 0 }, providersBR);
      const res = await service.getDetail(TitleType.MOVIE, 872585);
      expect(res.tmdbRating).toBe(0);
    });

    it('cast: ordena por order, corta no top 10 e trata profileUrl null', async () => {
      mockEndpoints(movieDetails, providersBR);
      const res = await service.getDetail(TitleType.MOVIE, 872585);
      expect(res.cast).toHaveLength(10);
      expect(res.cast[0]).toMatchObject({
        name: 'Cillian Murphy',
        character: 'J. R. Oppenheimer',
        profileUrl: 'https://image.tmdb.org/t/p/w185/cm.jpg',
      });
      const a3 = res.cast.find((c) => c.name === 'A3');
      expect(a3?.profileUrl).toBeNull();
      expect(res.cast.some((c) => c.name === 'A10' || c.name === 'A11')).toBe(
        false,
      );
    });

    it('sem provedor BR: 3 listas vazias e ficha intacta', async () => {
      mockEndpoints(movieDetails, providersNoBR);
      const res = await service.getDetail(TitleType.MOVIE, 872585);
      expect(res.providers).toMatchObject({
        flatrate: [],
        rent: [],
        buy: [],
      });
      expect(res.title).toBe('Oppenheimer');
    });

    it('provedores BR: ordena por display_priority e monta logoUrl', async () => {
      mockEndpoints(movieDetails, providersBR);
      const res = await service.getDetail(TitleType.MOVIE, 872585);
      expect(res.providers.flatrate.map((p) => p.name)).toEqual([
        'Amazon Prime Video',
        'HBO Max',
        'Netflix',
      ]);
      expect(res.providers.flatrate[0].logoUrl).toBe(
        'https://image.tmdb.org/t/p/w92/pv.jpg',
      );
      expect(res.providers.flatrate[1].logoUrl).toBeNull();
    });

    it('404 da TMDB nos detalhes → NotFoundException', async () => {
      mockTmdb.get.mockImplementation((path: string) =>
        path.endsWith('/watch/providers')
          ? Promise.resolve(providersBR)
          : Promise.reject(
              Object.assign(new Error('404'), { response: { status: 404 } }),
            ),
      );
      await expect(
        service.getDetail(TitleType.MOVIE, 999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('erro de rede da TMDB → BadGatewayException sem crash', async () => {
      mockTmdb.get.mockRejectedValue(new Error('network'));
      await expect(
        service.getDetail(TitleType.MOVIE, 872585),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('cache hit: 2ª chamada não rebate na TMDB', async () => {
      mockEndpoints(movieDetails, providersBR);
      await service.getDetail(TitleType.MOVIE, 872585);
      await service.getDetail(TitleType.MOVIE, 872585);
      expect(mockTmdb.get).toHaveBeenCalledTimes(2);
    });

    it('overview vazio permanece vazio (D1)', async () => {
      mockEndpoints({ ...movieDetails, overview: '' }, providersBR);
      const res = await service.getDetail(TitleType.MOVIE, 872585);
      expect(res.overview).toBe('');
    });
  });
});
