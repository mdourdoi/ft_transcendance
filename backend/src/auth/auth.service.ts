import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload.interface';
import { ErrorCode } from '../common/error-codes';
import { verify } from 'otplib';
import { decryptSecret } from '../common/crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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
      if (!dto.code) {
        throw new UnauthorizedException(ErrorCode.TWOFA_CODE_REQUIRED);
      }
      if (!row.twoFactorSecret) {
        throw new InternalServerErrorException(ErrorCode.TWOFA_NOT_INITIALIZED);
      }
      let secret: string;
      try {
        secret = decryptSecret(row.twoFactorSecret);
      } catch {
        throw new InternalServerErrorException(
          ErrorCode.TWOFA_SECRET_UNREADABLE,
        );
      }
      const result = await verify({
        secret,
        token: dto.code,
      });
      if (!result.valid) {
        throw new UnauthorizedException(ErrorCode.INVALID_TWOFA_CODE);
      }
    }

    const payload: JwtPayload = { sub: row.id, username: row.username };

    return { accessToken: this.jwt.sign(payload) };
  }
}
