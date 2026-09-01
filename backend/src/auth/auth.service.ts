import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(private prisma: PrismaService) { }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const row = await this.prisma.user.create({ data: { email: dto.email, username: dto.username, passwordHash: passwordHash } });
      return ({ id: row.id, username: row.username, createdAt: row.createdAt });
    } catch (e) {
      if (e.code === "P2002") throw new ConflictException("Username and/or email adress already in use");
      throw (e);
    }
  }
}
