import { ConflictException, Injectable } from '@nestjs/common';
import { TmdbType, WatchedOrigin } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TitleType } from '../../titles/dto/title-type.enum';
import {
  WatchedResponseDto,
  WatchedStateDto,
} from './dto/watched-response.dto';

@Injectable()
export class WatchedService {
  constructor(private readonly prisma: PrismaService) {}

  private toTmdbType(type: TitleType): TmdbType {
    return type === TitleType.MOVIE ? TmdbType.MOVIE : TmdbType.TV;
  }

  /**
   * Marca o título como visto manual (idempotente). Se já havia um visto 'auto'
   * (criado por uma avaliação), promove para 'manual': o usuário assumiu o
   * visto, então ele passa a sobreviver à remoção da avaliação.
   */
  async mark(
    userId: number,
    type: TitleType,
    tmdbId: number,
  ): Promise<WatchedResponseDto> {
    const tmdbType = this.toTmdbType(type);

    const watched = await this.prisma.watched.upsert({
      where: { userId_tmdbId_tmdbType: { userId, tmdbId, tmdbType } },
      update: { origem: WatchedOrigin.manual },
      create: { userId, tmdbId, tmdbType, origem: WatchedOrigin.manual },
    });

    return new WatchedResponseDto({
      watched: new WatchedStateDto({ origem: watched.origem }),
    });
  }

  /**
   * Desmarca o visto manual. Bloqueia com 409 se houver avaliação ativa — não
   * se pode desmarcar enquanto existir avaliação (o visto a sustenta). Sem
   * avaliação, remove o visto; idempotente quando não há nem visto nem nota.
   */
  async unmark(userId: number, type: TitleType, tmdbId: number): Promise<void> {
    const tmdbType = this.toTmdbType(type);
    const key = { userId_tmdbId_tmdbType: { userId, tmdbId, tmdbType } };

    await this.prisma.$transaction(async (tx) => {
      const rating = await tx.rating.findUnique({ where: key });
      if (rating) {
        throw new ConflictException(
          'Não é possível desmarcar o visto enquanto houver uma avaliação. Remova a avaliação primeiro.',
        );
      }
      await tx.watched.deleteMany({ where: { userId, tmdbId, tmdbType } });
    });
  }
}
