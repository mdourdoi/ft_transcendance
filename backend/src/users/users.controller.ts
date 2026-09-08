import { BadRequestException, Body, Controller, Get, Post, Patch, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorCodes } from '../common/error-codes';
import { ServeStaticModule } from '@nestjs/serve-static';

const MIME_TO_EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

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

  @UseGuards(JwtGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: '/app/uploads/avatars',
      filename: (req: any, file, cb) => cb(null, `${req.user.sub}-${Date.now()}.${MIME_TO_EXT[file.mimetype]}`),
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('INVALID_FILE_TYPE'), false);
      }
    },
  }))
  updateAvatar(@Req() req, @UploadedFile() file) {
    if (!file) {
      throw new BadRequestException(ErrorCodes.MISSING_FILE);
    }
    return this.userService.updateAvatar(req.user.sub, file.filename);
  }
}
