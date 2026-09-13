import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import * as FileType from 'file-type';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorCode } from '../common/error-codes';
import { MIME_TO_EXT } from '../common/mime-types';
import { AVATAR_UPLOAD_DIR } from '../constants';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(userId: number) {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!row) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
    };
  }

  async update(userId: number, dto: UpdateUserDto) {
    const data: { username?: string; email?: string } = {};
    if (dto.username) {
      data.username = dto.username;
    }
    if (dto.email) {
      data.email = dto.email;
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException(ErrorCode.NO_DATA_UPDATED);
    }

    try {
      const row = await this.prisma.user.update({
        where: { id: userId },
        data,
      });
      return {
        id: userId,
        username: row.username,
        email: row.email,
        avatarUrl: row.avatarUrl,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
        throw new ConflictException(ErrorCode.USERNAME_OR_EMAIL_ALREADY_TAKEN);
      throw e;
    }
  }

  async updateAvatar(userId: number, filename: string) {
    const type = await FileType.fromFile(join(AVATAR_UPLOAD_DIR, filename));
    if (!type || !MIME_TO_EXT[type.mime]) {
      await this.removeAvatarFile(filename);
      throw new BadRequestException(ErrorCode.INVALID_FILE_TYPE);
    }

    const current = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!current) {
      await this.removeAvatarFile(filename);
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    const row = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: filename },
    });
    if (current.avatarUrl) {
      await this.removeAvatarFile(current.avatarUrl);
    }
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
    };
  }

  private async removeAvatarFile(filename: string) {
    try {
      await unlink(join(AVATAR_UPLOAD_DIR, filename));
    } catch (e) {
      console.warn('avatar cleanup failed:', e);
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!row) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (dto.newPassword === dto.oldPassword) {
      throw new BadRequestException(ErrorCode.PASSWORD_UNCHANGED);
    }
    const corresponding = await bcrypt.compare(dto.oldPassword, row.passwordHash);
    if (!corresponding) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS);
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    const newRow = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
    return {
      id: userId,
      username: newRow.username,
      email: newRow.email,
      avatarUrl: newRow.avatarUrl,
    };
  }
}
