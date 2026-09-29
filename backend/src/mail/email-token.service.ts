import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import { ErrorCode } from '../common/error-codes.js';
import { EmailTokenType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;

const hash = (raw: string) => createHash('sha256').update(raw).digest('hex');

@Injectable()
export class EmailTokenService {
  constructor(private prisma: PrismaService) {}

  private async issue(
    userId: number,
    type: EmailTokenType,
    raw: string,
    ttlMs: number,
    deliver: (raw: string) => Promise<void>,
  ) {
    const last = await this.prisma.emailToken.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
    });
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new HttpException(
        ErrorCode.MAIL_RATE_LIMITED,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const [, token] = await this.prisma.$transaction([
      this.prisma.emailToken.updateMany({
        where: { userId, type, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailToken.create({
        data: {
          userId,
          type,
          tokenHash: hash(raw),
          expiresAt: new Date(Date.now() + ttlMs),
        },
      }),
    ]);

    try {
      await deliver(raw);
    } catch (e) {
      await this.prisma.emailToken.delete({ where: { id: token.id } });
      console.warn('mail delivery failed:', e);
      throw new ServiceUnavailableException(ErrorCode.MAIL_SEND_FAILED);
    }
  }

  createCode(
    userId: number,
    type: EmailTokenType,
    ttlMs: number,
    deliver: (code: string) => Promise<void>,
  ) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    return this.issue(userId, type, code, ttlMs, deliver);
  }

  createLinkToken(
    userId: number,
    type: EmailTokenType,
    ttlMs: number,
    deliver: (token: string) => Promise<void>,
  ) {
    return this.issue(
      userId,
      type,
      randomBytes(32).toString('base64url'),
      ttlMs,
      deliver,
    );
  }

  async consumeCode(userId: number, type: EmailTokenType, code: string) {
    const token = await this.prisma.emailToken.findFirst({
      where: { userId, type, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!token || token.attempts >= MAX_ATTEMPTS) return false;

    const ok = timingSafeEqual(
      Buffer.from(hash(code)),
      Buffer.from(token.tokenHash),
    );
    if (!ok) {
      await this.prisma.emailToken.update({
        where: { id: token.id },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }

    const { count } = await this.prisma.emailToken.updateMany({
      where: { id: token.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return count === 1;
  }

  async consumeLinkToken(type: EmailTokenType, raw: string) {
    const token = await this.prisma.emailToken.findFirst({
      where: {
        type,
        tokenHash: hash(raw),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!token) return null;
    const { count } = await this.prisma.emailToken.updateMany({
      where: { id: token.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return count === 1 ? token.userId : null;
  }
}
