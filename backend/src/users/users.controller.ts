import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {

	constructor(private userService: UsersService) { }

	@UseGuards(JwtGuard)
	@Get('me')
	me(@Req() req) {
		return this.userService.me(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Patch('me')
  update(@Req() req, @Body() dto: UpdateUserDto) {
    return this.userService.update(req.user.sub, dto)
  }
}
