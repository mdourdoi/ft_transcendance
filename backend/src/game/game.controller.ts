import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { GameService } from './game.service.js';

@Controller('games')
@UseGuards(JwtGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('current')
  async current(@CurrentUser('sub') userId: number) {
    return { game: await this.gameService.current(userId) };
  }
}
