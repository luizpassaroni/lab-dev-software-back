import { Injectable } from '@nestjs/common';
import { TmdbType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TitleType } from '../../titles/dto/title-type.enum';

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  private toTmdbType(type: TitleType): TmdbType {
    return type === TitleType.MOVIE ? TmdbType.MOVIE : TmdbType.TV;
  }


  async add(userId: number, type: TitleType, tmdbId: number): Promise<void> {
    const tmdbType = this.toTmdbType(type);

    await this.prisma.favorite.upsert({
      where: { userId_tmdbId_tmdbType: { userId, tmdbId, tmdbType } },
      update: {},
      create: { userId, tmdbId, tmdbType },
    });
  }

  
  async remove(userId: number, type: TitleType, tmdbId: number): Promise<void> {
    const tmdbType = this.toTmdbType(type);

    await this.prisma.favorite.deleteMany({
      where: { userId, tmdbId, tmdbType },
    });
  }
}