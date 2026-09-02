import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(private prisma: PrismaService, private jwt: JwtService) { }

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

  async login(dto: LoginDto) {
    const row = await this.prisma.user.findUnique({ where: { username: dto.username } });
    let corresponding = false;
    
    if (!row) {
      await bcrypt.hash(dto.password, 10);
    } else {
      corresponding = await bcrypt.compare(dto.password, row.passwordHash);
    }
    if (!row || !corresponding) {
      throw new UnauthorizedException("Invalid logging informations");
    }

    const payload = { sub: row.id, username: row.username };
    
    return { accessToken: this.jwt.sign(payload) };
  }
}
