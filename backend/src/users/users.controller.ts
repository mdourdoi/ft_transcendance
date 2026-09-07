import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  me(@CurrentUser('sub') userId: number) {
    return this.userService.me(userId);
  }

  @UseGuards(JwtGuard)
  @Patch('me')
  update(@CurrentUser('sub') userId: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(userId, dto);
  }
}
