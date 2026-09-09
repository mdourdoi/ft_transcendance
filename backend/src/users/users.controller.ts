import { BadRequestException, Body, Controller, Get, Post, Patch, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorCodes } from '../common/error-codes';
import { MIME_TO_EXT } from '../common/mime-types';
import { RequestWithUser } from '../common/request-with-user';


@Controller('users')
export class UsersController {

	constructor(private userService: UsersService) { }

	@UseGuards(JwtGuard)
	@Get('me')
	me(@Req() req: RequestWithUser) {
		return this.userService.me(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Patch('me')
  update(@Req() req: RequestWithUser, @Body() dto: UpdateUserDto) {
    return this.userService.update(req.user.sub, dto)
  }

  @UseGuards(JwtGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: '/app/uploads/avatars',
      filename: (req: any, file, cb) => cb(null, `${req.user.sub}-${Date.now()}.${MIME_TO_EXT[file.mimetype]}`),
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (Object.keys(MIME_TO_EXT).includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(ErrorCodes.INVALID_FILE_TYPE), false);
      }
    },
  }))
  updateAvatar(@Req() req: RequestWithUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(ErrorCodes.MISSING_FILE);
    }
    return this.userService.updateAvatar(req.user.sub, file.filename);
  }
}
