import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { AuthenticatedRequest } from '../auth/types/jwt-payload.interface.js';
import { ErrorCode } from '../common/error-codes.js';
import { MIME_TO_EXT } from '../common/mime-types.js';
import { AVATAR_UPLOAD_DIR } from '../constants.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { EmailTokenDto } from './dto/email-token.dto.js';
import { FindUserDto } from './dto/find-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

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

  @UseGuards(JwtGuard)
  @Patch('me/password')
  changePassword(
    @CurrentUser('sub') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(userId, dto);
  }

  @UseGuards(JwtGuard)
  @Get('me/export')
  exportData(@CurrentUser('sub') userId: number) {
    return this.userService.exportData(userId);
  }

  @UseGuards(JwtGuard)
  @Post('me/verify-email')
  @HttpCode(204)
  requestEmailVerification(@CurrentUser('sub') userId: number) {
    return this.userService.requestEmailVerification(userId);
  }

  @Post('verify-email/confirm')
  @HttpCode(204)
  confirmEmailVerification(@Body() dto: EmailTokenDto) {
    return this.userService.confirmEmailVerification(dto.token);
  }

  @UseGuards(JwtGuard)
  @Post('me/delete-request')
  @HttpCode(204)
  requestDeletion(@CurrentUser('sub') userId: number) {
    return this.userService.requestDeletion(userId);
  }

  @Post('delete-confirm')
  @HttpCode(204)
  confirmDeletion(@Body() dto: EmailTokenDto) {
    return this.userService.confirmDeletion(dto.token);
  }

  @UseGuards(JwtGuard)
  @Post('find')
  @HttpCode(HttpStatus.OK)
  find(@Body() dto: FindUserDto) {
    return this.userService.find(dto.username);
  }
}
