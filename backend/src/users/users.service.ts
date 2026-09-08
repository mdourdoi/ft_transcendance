import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
