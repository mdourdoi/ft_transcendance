import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { ErrorCode } from '../common/error-codes.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { TwofaVerifierService } from './twofa-verifier.service.js';
import { JwtPayload } from './types/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private twofaVerifier: TwofaVerifierService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const row = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          passwordHash: passwordHash,
        },
      });
      return { id: row.id, username: row.username, createdAt: row.createdAt };
    } catch (e) {
      if (e.code === 'P2002')
        throw new ConflictException(ErrorCode.USERNAME_OR_EMAIL_ALREADY_TAKEN);
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const row = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    let corresponding = false;

    if (!row) {
      await bcrypt.hash(dto.password, 10);
    } else {
      corresponding = await bcrypt.compare(dto.password, row.passwordHash);
    }
    if (!row || !corresponding) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS);
    }

    if (row.twoFactorEnabled) {
      await this.twofaVerifier.assertValidCode(row, dto.code);
    }

    const payload: JwtPayload = { sub: row.id, username: row.username };

    return { accessToken: this.jwt.sign(payload) };
  }
}
