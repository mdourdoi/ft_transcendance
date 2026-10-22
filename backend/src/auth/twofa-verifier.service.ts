import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { verify } from 'otplib';
import { decryptSecret } from '../common/crypto.js';
import { ErrorCode } from '../common/error-codes.js';
import { User } from '../generated/prisma/client.js';
import { EmailTokenService } from '../mail/email-token.service.js';
import { MailService } from '../mail/mail.service.js';
import { REDIS_CLIENT } from '../redis/redis.constants.js';

const TWOFA_EMAIL_CODE_TTL_MS = 10 * 60_000;
const MAX_TOTP_FAILURES = 5;
const TOTP_LOCK_SECONDS = 15 * 60;
const TOTP_USED_TTL_SECONDS = 90;

@Injectable()
export class TwofaVerifierService {
  constructor(
    private emailTokens: EmailTokenService,
    private mail: MailService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  sendEmailCode(user: User) {
    return this.emailTokens.createCode(
      user.id,
      'TWOFA_LOGIN',
      TWOFA_EMAIL_CODE_TTL_MS,
      (code) => this.mail.sendTwofaCode(user.email, code),
    );
  }

  async assertValidCode(user: User, code?: string) {
    if (user.twoFactorMethod === 'EMAIL') {
      if (!code) {
        await this.sendEmailCode(user);
        throw new UnauthorizedException(ErrorCode.TWOFA_CODE_REQUIRED);
      }
      if (!(await this.emailTokens.consumeCode(user.id, 'TWOFA_LOGIN', code))) {
        throw new UnauthorizedException(ErrorCode.INVALID_TWOFA_CODE);
      }
      return;
    }

    if (!code) {
      throw new UnauthorizedException(ErrorCode.TWOFA_CODE_REQUIRED);
    }
    if (!user.twoFactorSecret) {
      throw new InternalServerErrorException(ErrorCode.TWOFA_NOT_INITIALIZED);
    }
    await this.assertValidTotp(user.id, user.twoFactorSecret, code);
  }

  async assertValidLoginCode(user: User, code?: string, sendEmailCode = false) {
    if (user.twoFactorMethod === 'TOTP' && user.emailVerifiedAt) {
      if (!code && sendEmailCode) {
        await this.sendEmailCode(user);
        throw new UnauthorizedException(ErrorCode.TWOFA_CODE_REQUIRED);
      }
      if (
        code &&
        (await this.emailTokens.consumeCode(user.id, 'TWOFA_LOGIN', code))
      ) {
        return;
      }
    }
    await this.assertValidCode(user, code);
  }

  async assertValidTotp(userId: number, encryptedSecret: string, code: string) {
    const failKey = `twofa:fail:${userId}`;
    if (Number(await this.redis.get(failKey)) >= MAX_TOTP_FAILURES) {
      throw new HttpException(
        ErrorCode.TWOFA_RATE_LIMITED,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let secret: string;
    try {
      secret = decryptSecret(encryptedSecret);
    } catch {
      throw new InternalServerErrorException(ErrorCode.TWOFA_SECRET_UNREADABLE);
    }

    const result = await verify({ secret, token: code });
    if (!result.valid) {
      await this.redis
        .multi()
        .incr(failKey)
        .expire(failKey, TOTP_LOCK_SECONDS)
        .exec();
      throw new UnauthorizedException(ErrorCode.INVALID_TWOFA_CODE);
    }

    const fresh = await this.redis.set(
      `twofa:used:${userId}:${code}`,
      '1',
      'EX',
      TOTP_USED_TTL_SECONDS,
      'NX',
    );
    if (fresh !== 'OK') {
      throw new UnauthorizedException(ErrorCode.INVALID_TWOFA_CODE);
    }
    await this.redis.del(failKey);
  }
}
