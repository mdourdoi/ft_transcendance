import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { GameInviteDto } from './dto/game-invite.dto.js';
import { GameInvitesService } from './game-invites.service.js';

@Controller('game-invites')
@UseGuards(JwtGuard)
export class GameInvitesController {
  constructor(private readonly gameInvitesService: GameInvitesService) {}

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  send(@CurrentUser('sub') userId: number, @Body() dto: GameInviteDto) {
    return this.gameInvitesService.send(userId, dto.targetId);
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  accept(@CurrentUser('sub') userId: number, @Body() dto: GameInviteDto) {
    return this.gameInvitesService.accept(userId, dto.targetId);
  }

  @Post('decline')
  @HttpCode(HttpStatus.OK)
  decline(@CurrentUser('sub') userId: number, @Body() dto: GameInviteDto) {
    return this.gameInvitesService.decline(userId, dto.targetId);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser('sub') userId: number, @Body() dto: GameInviteDto) {
    return this.gameInvitesService.cancel(userId, dto.targetId);
  }
}
