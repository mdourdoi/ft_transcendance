import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorCode } from '../common/error-codes';

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
      return { id: userId, username: row.username, email: row.email };
    } catch (e) {
      if (e.code === 'P2002')
        throw new ConflictException(ErrorCode.USERNAME_OR_EMAIL_ALREADY_TAKEN);
      throw e;
    }
  }
}
