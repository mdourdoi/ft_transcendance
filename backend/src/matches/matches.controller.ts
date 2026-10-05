import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { MatchesService } from './matches.service.js';

@Controller('matches')
@UseGuards(JwtGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('current')
  async current(@CurrentUser('sub') userId: number) {
    return { match: await this.matchesService.findActiveForUser(userId) };
  }
}
