import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { TwofaCodeDto } from './dto/twofa-code.dto.js';
import { TwofaService } from './twofa.service.js';

@Controller('twofa')
export class TwofaController {
  constructor(private twofaService: TwofaService) {}

  @UseGuards(JwtGuard)
  @Post('setup')
  setup(@CurrentUser('sub') userId: number) {
    return this.twofaService.setup(userId);
  }

  @UseGuards(JwtGuard)
  @Post('verify')
  verify(@CurrentUser('sub') userId: number, @Body() dto: TwofaCodeDto) {
    return this.twofaService.verify(userId, dto.code);
  }

  @UseGuards(JwtGuard)
  @Post('delete')
  delete(@CurrentUser('sub') userId: number, @Body() dto: TwofaCodeDto) {
    return this.twofaService.delete(userId, dto.code);
  }
}
