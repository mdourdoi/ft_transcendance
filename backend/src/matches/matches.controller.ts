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
