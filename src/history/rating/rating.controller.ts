import {
  Body,
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
//import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import type { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { TitleType } from '../../titles/dto/title-type.enum';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingResponseDto } from './dto/rating-response.dto';
import { RatingService } from './rating.service';

@ApiTags('History')
@ApiSecurity('internal-key')
@ApiBearerAuth('bearer')
@Controller('titles')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post(':type/:id/rating')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cria ou troca a avaliação (1–10) e marca o título como visto',
  })
  @ApiParam({ name: 'type', enum: TitleType })
  @ApiParam({ name: 'id', type: Number, example: 872585 })
  @ApiOkResponse({ type: RatingResponseDto })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido' })
  setRating(
    @Param('type', new ParseEnumPipe(TitleType)) type: TitleType,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateRatingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<RatingResponseDto> {
    return this.ratingService.set(req.user.userId, type, id, dto.score);
  }

  @Delete(':type/:id/rating')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a avaliação; derruba o visto apenas se foi automático',
  })
  @ApiParam({ name: 'type', enum: TitleType })
  @ApiParam({ name: 'id', type: Number, example: 872585 })
  @ApiNoContentResponse({ description: 'Avaliação removida (idempotente)' })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido' })
  async removeRating(
    @Param('type', new ParseEnumPipe(TitleType)) type: TitleType,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.ratingService.remove(req.user.userId, type, id);
  }
}
