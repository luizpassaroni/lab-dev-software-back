import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HistoryTitleRef, historyWhere } from '../history.types';

@Injectable()
export class RatingService {
  constructor(private readonly prisma: PrismaService) {}

  async rate(
    userId: number,
    title: HistoryTitleRef,
    score: number,
  ): Promise<void> {
    const where = historyWhere(userId, title);
    const watched = await this.prisma.watched.findUnique({
      where,
      select: { id: true },
    });

    await this.prisma.rating.upsert({
      where,
      update: { score },
      create: {
        userId,
        tmdbId: title.tmdbId,
        tmdbType: title.tmdbType,
        score,
      },
    });

    if (!watched) {
      await this.prisma.watched.create({
        data: {
          userId,
          tmdbId: title.tmdbId,
          tmdbType: title.tmdbType,
          origem: 'auto',
        },
      });
    }
  }

  async remove(userId: number, title: HistoryTitleRef): Promise<void> {
    const where = historyWhere(userId, title);
    const watched = await this.prisma.watched.findUnique({
      where,
      select: { origem: true },
    });

    await this.prisma.rating.deleteMany({
      where: {
        userId,
        tmdbId: title.tmdbId,
        tmdbType: title.tmdbType,
      },
    });

    if (watched?.origem === 'auto') {
      await this.prisma.watched.deleteMany({
        where: {
          userId,
          tmdbId: title.tmdbId,
          tmdbType: title.tmdbType,
        },
      });
    }
  }
}
