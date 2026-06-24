import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HistoryTitleRef, historyWhere } from '../history.types';

@Injectable()
export class WatchedService {
  constructor(private readonly prisma: PrismaService) {}

  async mark(userId: number, title: HistoryTitleRef): Promise<void> {
    const where = historyWhere(userId, title);

    await this.prisma.watched.upsert({
      where,
      update: { origem: 'manual' },
      create: {
        userId,
        tmdbId: title.tmdbId,
        tmdbType: title.tmdbType,
        origem: 'manual',
      },
    });
  }

  async unmark(userId: number, title: HistoryTitleRef): Promise<void> {
    const where = historyWhere(userId, title);
    const rating = await this.prisma.rating.findUnique({
      where,
      select: { id: true },
    });

    if (rating) {
      throw new ConflictException(
        'Não é possível desmarcar visto enquanto houver avaliação.',
      );
    }

    await this.prisma.watched.deleteMany({
      where: {
        userId,
        tmdbId: title.tmdbId,
        tmdbType: title.tmdbType,
      },
    });
  }
}
