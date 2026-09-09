import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { unlink } from 'node:fs/promises';
import { ErrorCodes } from '../common/error-codes';
import * as FileType from 'file-type';
import { MIME_TO_EXT } from '../common/mime-types';

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) { }

	async me(userId: number) {
		const row = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!row) {
			throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);
		}
		return ({ id: row.id, email: row.email, username: row.username, avatarUrl: row.avatarUrl, createdAt: row.createdAt })
  }

  async update(userId: number, dto: UpdateUserDto) {
    if (!dto.username && !dto.email) {
      throw new BadRequestException(ErrorCodes.NO_DATA_UPDATED)
    }
    try {
      const row = await this.prisma.user.update({ where: { id: userId }, data: dto })
      return ({ id: userId, username: row.username, avatarUrl: row.avatarUrl, email: row.email, createdAt: row.createdAt });
    } catch (e) {
      if (e.code === "P2002") throw new ConflictException(ErrorCodes.USERNAME_OR_EMAIL_ALREADY_TAKEN);
      throw (e);
    }
  }

  async updateAvatar(userId: number, filename: string) {
    const type = await FileType.fromFile('/app/uploads/avatars/' + filename);
    if (!type || !MIME_TO_EXT[type.mime]) {
      try {
        await unlink('/app/uploads/avatars/' + filename);
      } catch (e) {
        console.warn('avatar cleanup failed:', e);
      }
      throw new BadRequestException(ErrorCodes.INVALID_FILE_TYPE);
    }
    const rowCache = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!rowCache) {
      try {
        await unlink('/app/uploads/avatars/' + filename);
      } catch (e) {
        console.warn('avatar cleanup failed:', e);
      }
			throw new NotFoundException(ErrorCodes.USER_NOT_FOUND);
    }
    const oldAvatarUrl = rowCache.avatarUrl;
    const row = await this.prisma.user.update({ where: { id: userId }, data: { avatarUrl: filename } });
    if (oldAvatarUrl) {
      try {
        await unlink('/app/uploads/avatars/' + oldAvatarUrl);
      } catch (e) {
        console.warn('avatar cleanup failed:', e);
      }
    }
    return ({ id: row.id, email: row.email, username: row.username, avatarUrl: row.avatarUrl, createdAt: row.createdAt });
  }
}
