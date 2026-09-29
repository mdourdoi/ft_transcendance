import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { ReportMatchResultDto } from './dto/report-match-result.dto.js';
import { MatchesService } from './matches.service.js';

@Controller('matches')
@UseGuards(JwtGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post(':id/result')
  @HttpCode(HttpStatus.OK)
  reportResult(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) matchId: number,
    @Body() dto: ReportMatchResultDto,
  ) {
    return this.matchesService.reportResult(matchId, userId, dto.winnerId);
  }
}
