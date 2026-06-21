import { Injectable } from '@nestjs/common';
import { TmdbType, WatchedOrigin } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TitleType } from '../../titles/dto/title-type.enum';
import {
  RatingResponseDto,
  RatingValueDto,
  WatchedValueDto,
} from './dto/rating-response.dto';

@Injectable()
export class RatingService {
  constructor(private readonly prisma: PrismaService) {}

  private toTmdbType(type: TitleType): TmdbType {
    return type === TitleType.MOVIE ? TmdbType.MOVIE : TmdbType.TV;
  }

  /**
   * Cria ou troca a avaliação do usuário (upsert na chave composta) e garante o
   * "visto": se ainda não há Watched, cria com origem 'auto'; se já existe
   * (manual ou auto), preserva a origem. Tudo numa transação.
   */
  async set(
    userId: number,
    type: TitleType,
    tmdbId: number,
    score: number,
  ): Promise<RatingResponseDto> {
    const tmdbType = this.toTmdbType(type);
    const key = { userId_tmdbId_tmdbType: { userId, tmdbId, tmdbType } };

    return this.prisma.$transaction(async (tx) => {
      const rating = await tx.rating.upsert({
        where: key,
        update: { score },
        create: { userId, tmdbId, tmdbType, score },
      });

      // Auto-visto (US-4.1): update vazio = não mexe na origem de um visto já
      // existente (preserva manual); create só dispara quando não há visto.
      const watched = await tx.watched.upsert({
        where: key,
        update: {},
        create: { userId, tmdbId, tmdbType, origem: WatchedOrigin.auto },
      });

      return new RatingResponseDto({
        rating: new RatingValueDto({ score: rating.score }),
        watched: new WatchedValueDto({ origem: watched.origem }),
      });
    });
  }

  /**
   * Remove a avaliação (idempotente) e derruba o "visto" apenas quando ele veio
   * da própria avaliação (origem 'auto'); um visto manual permanece.
   */
  async remove(userId: number, type: TitleType, tmdbId: number): Promise<void> {
    const tmdbType = this.toTmdbType(type);
    const where = { userId, tmdbId, tmdbType };

    await this.prisma.$transaction(async (tx) => {
      await tx.rating.deleteMany({ where });
      await tx.watched.deleteMany({
        where: { ...where, origem: WatchedOrigin.auto },
      });
    });
  }
}
