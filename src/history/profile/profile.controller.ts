import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import type { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@ApiSecurity('internal-key')
@ApiBearerAuth('bearer')
@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perfil do usuário — totais + 3 listas (30 itens)' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'JWT ausente ou inválido' })
  async getProfile(
    @Req() req: AuthenticatedRequest,
  ): Promise<ProfileResponseDto> {
    return this.profileService.get(req.user.userId);
  }
}