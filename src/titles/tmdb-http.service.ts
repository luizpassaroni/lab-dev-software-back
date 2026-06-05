import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

@Injectable()
export class TmdbHttpService {
  private readonly accessToken: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.accessToken = configService.getOrThrow<string>('TMDB_API_TOKEN');
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const response = await firstValueFrom(
      this.httpService.get<T>(`${TMDB_BASE_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json',
        },
        params: {
          language: 'pt-BR',
          region: 'BR',
          ...params,
        },
      }),
    );

    return response.data;
  }
}
