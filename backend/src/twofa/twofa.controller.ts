import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { OptionalTwofaCodeDto } from './dto/optional-twofa-code.dto.js';
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
  delete(
    @CurrentUser('sub') userId: number,
    @Body() dto: OptionalTwofaCodeDto,
  ) {
    return this.twofaService.delete(userId, dto.code);
  }

  @UseGuards(JwtGuard)
  @Post('email/setup')
  @HttpCode(204)
  emailSetup(@CurrentUser('sub') userId: number) {
    return this.twofaService.emailSetup(userId);
  }

  @UseGuards(JwtGuard)
  @Post('email/verify')
  emailVerify(@CurrentUser('sub') userId: number, @Body() dto: TwofaCodeDto) {
    return this.twofaService.emailVerify(userId, dto.code);
  }
}
