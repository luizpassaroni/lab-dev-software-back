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
  ApiConflictResponse,
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
import { WatchedResponseDto } from './dto/watched-response.dto';
import { WatchedService } from './watched.service';

@ApiTags('History')
@ApiSecurity('internal-key')
@ApiBearerAuth('bearer')
@Controller('titles')
export class WatchedController {
  constructor(private readonly watchedService: WatchedService) {}

  @Post(':type/:id/watched')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca o título como visto (manual)' })
  @ApiParam({ name: 'type', enum: TitleType })
  @ApiParam({ name: 'id', type: Number, example: 872585 })
  @ApiOkResponse({ type: WatchedResponseDto })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido' })
  markWatched(
    @Param('type', new ParseEnumPipe(TitleType)) type: TitleType,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<WatchedResponseDto> {
    return this.watchedService.mark(req.user.userId, type, id);
  }

  @Delete(':type/:id/watched')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desmarca o visto manual; 409 se houver avaliação ativa',
  })
  @ApiParam({ name: 'type', enum: TitleType })
  @ApiParam({ name: 'id', type: Number, example: 872585 })
  @ApiNoContentResponse({ description: 'Visto removido (idempotente)' })
  @ApiConflictResponse({
    description: 'Há uma avaliação ativa; remova-a antes de desmarcar o visto',
  })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido' })
  async unmarkWatched(
    @Param('type', new ParseEnumPipe(TitleType)) type: TitleType,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.watchedService.unmark(req.user.userId, type, id);
  }
}
