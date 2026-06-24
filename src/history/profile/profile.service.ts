import { Injectable } from '@nestjs/common';
import { TmdbType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TitlesService } from '../../titles/titles.service';
import { TitleType } from '../../titles/dto/title-type.enum';
import {
  CardDto,
  ProfileResponseDto,
  ProfileTotaisDto,
  RatedCardDto,
} from './dto/profile-response.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly titlesService: TitlesService,
  ) {}

  private toTitleType(tmdbType: TmdbType): TitleType {
    return tmdbType === TmdbType.MOVIE ? TitleType.MOVIE : TitleType.TV;
  }

  async get(userId: number): Promise<ProfileResponseDto> {
    const [
      totalVistos,
      totalAvaliados,
      totalFavoritos,
      rowsVistos,
      rowsAvaliados,
      rowsFavoritos,
    ] = await Promise.all([
      this.prisma.watched.count({ where: { userId } }),
      this.prisma.rating.count({ where: { userId } }),
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.watched.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        take: 30,
      }),
      this.prisma.rating.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const [vistos, avaliados, favoritos] = await Promise.all([
      Promise.all(
        rowsVistos.map(async (r) => {
          const card = await this.titlesService.getCardSummary(
            this.toTitleType(r.tmdbType),
            r.tmdbId,
          );
          return new CardDto(card);
        }),
      ),
      Promise.all(
        rowsAvaliados.map(async (r) => {
          const card = await this.titlesService.getCardSummary(
            this.toTitleType(r.tmdbType),
            r.tmdbId,
          );
          return new RatedCardDto({ ...card, score: r.score });
        }),
      ),
      Promise.all(
        rowsFavoritos.map(async (r) => {
          const card = await this.titlesService.getCardSummary(
            this.toTitleType(r.tmdbType),
            r.tmdbId,
          );
          return new CardDto(card);
        }),
      ),
    ]);

    return new ProfileResponseDto({
      totais: new ProfileTotaisDto({
        vistos: totalVistos,
        avaliados: totalAvaliados,
        favoritos: totalFavoritos,
      }),
      vistos,
      avaliados,
      favoritos,
    });
  }
}