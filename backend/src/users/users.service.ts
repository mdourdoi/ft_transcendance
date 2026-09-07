import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) { }

	async me(userId: number) {
		const row = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!row) {
			throw new NotFoundException('USER_NOT_FOUND');
		}
		return ({ id: row.id, email: row.email, username: row.username, createdAt: row.createdAt })
  }

  async update(userId: number, dto: UpdateUserDto) {
    if (!dto.username && !dto.email) {
      throw new BadRequestException("NO_DATA_UPDATED")
    }
    try {
      const row = await this.prisma.user.update({ where: { id: userId }, data: dto })
      return ({ id: userId, username: row.username, email: row.email});
    } catch (e) {
      if (e.code === "P2002") throw new ConflictException("USERNAME_OR_MAIL_ALREADY_TAKEN");
      throw (e);
    }
  }
}
