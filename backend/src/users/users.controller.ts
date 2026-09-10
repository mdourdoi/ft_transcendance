import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedRequest } from '../auth/types/jwt-payload.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorCode } from '../common/error-codes';
import { MIME_TO_EXT } from '../common/mime-types';
import { AVATAR_UPLOAD_DIR } from '../constants';

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

  @UseGuards(JwtGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: AVATAR_UPLOAD_DIR,
        filename: (req: AuthenticatedRequest, file, cb) =>
          cb(
            null,
            `${req.user.sub}-${Date.now()}.${MIME_TO_EXT[file.mimetype]}`,
          ),
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (MIME_TO_EXT[file.mimetype]) {
          cb(null, true);
        } else {
          cb(new BadRequestException(ErrorCode.INVALID_FILE_TYPE), false);
        }
      },
    }),
  )
  updateAvatar(
    @CurrentUser('sub') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(ErrorCode.MISSING_FILE);
    }
    return this.userService.updateAvatar(userId, file.filename);
  }
}
