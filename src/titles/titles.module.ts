import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';

@Module({
  imports: [HttpModule],
  controllers: [TitlesController],
  providers: [TitlesService],
})
export class TitlesModule {}
