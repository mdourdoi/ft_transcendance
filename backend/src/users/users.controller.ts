import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('users')
export class UsersController {

	constructor(private userService: UsersService) { }

	@UseGuards(JwtGuard)
	@Get('me')
	me(@Req() req) {
		return this.userService.me(req.user.sub);
	}
}
