import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { TmdbHttpService } from './tmdb-http.service';

describe('TmdbHttpService', () => {
  let service: TmdbHttpService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn(() => 'test-tmdb-token'),
  };

  beforeEach(async () => {
    mockHttpService.get.mockReturnValue(of({ data: { results: [] } }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmdbHttpService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TmdbHttpService>(TmdbHttpService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('construtor', () => {
    it('deve falhar se TMDB_API_TOKEN não estiver definido', () => {
      const failingConfig = {
        getOrThrow: jest.fn(() => {
          throw new Error('TMDB_API_TOKEN is required');
        }),
      } as unknown as ConfigService;

      expect(
        () =>
          new TmdbHttpService(
            mockHttpService as unknown as HttpService,
            failingConfig,
          ),
      ).toThrow('TMDB_API_TOKEN is required');
    });
  });

  describe('get', () => {
    it('deve chamar a TMDB com base URL, Bearer e os defaults pt-BR/BR', async () => {
      await service.get('/search/multi', { query: 'Oppenheimer' });

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/search/multi',
        {
          headers: {
            Authorization: 'Bearer test-tmdb-token',
            Accept: 'application/json',
          },
          params: {
            language: 'pt-BR',
            region: 'BR',
            query: 'Oppenheimer',
          },
        },
      );
    });

    it('deve devolver apenas o data da resposta', async () => {
      const payload = { results: [{ id: 872585 }] };
      mockHttpService.get.mockReturnValueOnce(of({ data: payload }));

      const result = await service.get('/search/multi', {
        query: 'Oppenheimer',
      });

      expect(result).toEqual(payload);
    });

    it('deve permitir sobrescrever um default por chamada', async () => {
      await service.get('/movie/872585', { language: 'en-US' });

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/movie/872585',
        expect.objectContaining({
          params: { language: 'en-US', region: 'BR' },
        }),
      );
    });
  });
});
