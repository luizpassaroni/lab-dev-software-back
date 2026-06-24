import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HistoryTitleRef, historyWhere } from '../history.types';

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: number, title: HistoryTitleRef): Promise<void> {
    const where = historyWhere(userId, title);

    await this.prisma.favorite.upsert({
      where,
      update: {},
      create: {
        userId,
        tmdbId: title.tmdbId,
        tmdbType: title.tmdbType,
      },
    });
  }

  async remove(userId: number, title: HistoryTitleRef): Promise<void> {
    await this.prisma.favorite.deleteMany({
      where: {
        userId,
        tmdbId: title.tmdbId,
        tmdbType: title.tmdbType,
      },
    });
  }
}
