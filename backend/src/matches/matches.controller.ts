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
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ReportMatchResultDto } from './dto/report-match-result.dto';
import { MatchesService } from './matches.service';

@Controller('matches')
@UseGuards(JwtGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  /**
   * Report the result of a finished match. Only the two players of the match
   * can report it, and it updates ratings when the match was ranked.
   *
   * @example POST localhost:5173/matches/1/result {...}
   */
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
