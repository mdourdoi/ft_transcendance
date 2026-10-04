import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { TwofaVerifierService } from '../auth/twofa-verifier.service.js';
import { decryptSecret, encryptSecret } from '../common/crypto.js';
import { ErrorCode } from '../common/error-codes.js';
import { Prisma } from '../generated/prisma/client.js';
import { EmailTokenService } from '../mail/email-token.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TwofaService {
  constructor(
    private prisma: PrismaService,
    private emailTokens: EmailTokenService,
    private twofaVerifier: TwofaVerifierService,
  ) {}

  async setup(userId: number) {
    const check = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!check) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (check.twoFactorEnabled) {
      throw new ConflictException(ErrorCode.TWOFA_ALREADY_ENABLED);
    }
    try {
      const secret = generateSecret();
      const row = await this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: encryptSecret(secret) },
      });
      const uri = generateURI({
        issuer: 'Transcendence',
        label: row.username,
        secret,
      });
      const qr = await QRCode.toDataURL(uri);
      return {
        id: userId,
        username: row.username,
        twoFactorSecret: secret,
        qr: qr,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      )
        throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
      throw e;
    }
  }

  async verify(userId: number, code: string) {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!row) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (row.twoFactorEnabled) {
      throw new ConflictException(ErrorCode.TWOFA_ALREADY_ENABLED);
    }
    if (!row.twoFactorSecret) {
      throw new BadRequestException(ErrorCode.TWOFA_NOT_INITIALIZED);
    }
    let secret: string;
    try {
      secret = decryptSecret(row.twoFactorSecret);
    } catch {
      throw new InternalServerErrorException(ErrorCode.TWOFA_SECRET_UNREADABLE);
    }
    const result = await verify({ secret, token: code });
    if (!result.valid) {
      throw new UnauthorizedException(ErrorCode.INVALID_TWOFA_CODE);
    }
    const activatedRow = await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
    return {
      id: userId,
      username: activatedRow.username,
      email: activatedRow.email,
      twoFactorEnabled: activatedRow.twoFactorEnabled,
    };
  }

  async delete(userId: number, code?: string) {
    const check = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!check) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (!check.twoFactorEnabled) {
      throw new ConflictException(ErrorCode.TWOFA_NOT_ENABLED);
    }
    await this.twofaVerifier.assertValidCode(check, code);
    try {
      const row = await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorMethod: 'TOTP',
        },
      });
      return {
        id: userId,
        username: row.username,
        twoFactorEnabled: row.twoFactorEnabled,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      )
        throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
      throw e;
    }
  }

  async emailSetup(userId: number) {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!row) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (row.twoFactorEnabled) {
      throw new ConflictException(ErrorCode.TWOFA_ALREADY_ENABLED);
    }
    if (!row.emailVerifiedAt) {
      throw new ForbiddenException(ErrorCode.EMAIL_NOT_VERIFIED);
    }
    await this.twofaVerifier.sendEmailCode(row);
  }

  async emailVerify(userId: number, code: string) {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!row) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (row.twoFactorEnabled) {
      throw new ConflictException(ErrorCode.TWOFA_ALREADY_ENABLED);
    }
    if (!row.emailVerifiedAt) {
      throw new ForbiddenException(ErrorCode.EMAIL_NOT_VERIFIED);
    }
    if (!(await this.emailTokens.consumeCode(userId, 'TWOFA_LOGIN', code))) {
      throw new UnauthorizedException(ErrorCode.INVALID_TWOFA_CODE);
    }
    const activatedRow = await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: 'EMAIL',
        twoFactorSecret: null,
      },
    });
    return {
      id: userId,
      username: activatedRow.username,
      email: activatedRow.email,
      twoFactorEnabled: activatedRow.twoFactorEnabled,
      twoFactorMethod: activatedRow.twoFactorMethod,
    };
  }
}
