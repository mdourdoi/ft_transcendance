import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { BotsService } from './bots.service.js';

@Controller('bots')
@UseGuards(JwtGuard)
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post('matches')
  @HttpCode(HttpStatus.CREATED)
  startMatch(@CurrentUser('sub') userId: number) {
    return this.botsService.startMatch(userId);
  }
}
