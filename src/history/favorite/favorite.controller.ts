import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import type { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { TitleType } from '../../titles/dto/title-type.enum';
import { FavoriteResponseDto } from './dto/favorite-response.dto';
import { FavoriteService } from './favorite.service';

@ApiTags('History')
@ApiSecurity('internal-key')
@ApiBearerAuth('bearer')
@Controller('titles')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post(':type/:id/favorite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Favorita o título (idempotente)' })
  @ApiParam({ name: 'type', enum: TitleType })
  @ApiParam({ name: 'id', type: Number, example: 872585 })
  @ApiOkResponse({ type: FavoriteResponseDto })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido' })
  async favorite(
    @Param('type', new ParseEnumPipe(TitleType)) type: TitleType,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<FavoriteResponseDto> {
    await this.favoriteService.add(req.user.userId, type, id);
    return new FavoriteResponseDto({ favorite: true });
  }

  @Delete(':type/:id/favorite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desfavorita o título (idempotente)' })
  @ApiParam({ name: 'type', enum: TitleType })
  @ApiParam({ name: 'id', type: Number, example: 872585 })
  @ApiNoContentResponse({ description: 'Favorito removido (idempotente)' })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido' })
  async unfavorite(
    @Param('type', new ParseEnumPipe(TitleType)) type: TitleType,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.favoriteService.remove(req.user.userId, type, id);
  }
}