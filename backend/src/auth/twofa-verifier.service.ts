import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'otplib';
import { decryptSecret } from '../common/crypto.js';
import { ErrorCode } from '../common/error-codes.js';
import { User } from '../generated/prisma/client.js';
import { EmailTokenService } from '../mail/email-token.service.js';
import { MailService } from '../mail/mail.service.js';

const TWOFA_EMAIL_CODE_TTL_MS = 10 * 60_000;

@Injectable()
export class TwofaVerifierService {
  constructor(
    private emailTokens: EmailTokenService,
    private mail: MailService,
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
    let secret: string;
    try {
      secret = decryptSecret(user.twoFactorSecret);
    } catch {
      throw new InternalServerErrorException(ErrorCode.TWOFA_SECRET_UNREADABLE);
    }
    const result = await verify({ secret, token: code });
    if (!result.valid) {
      throw new UnauthorizedException(ErrorCode.INVALID_TWOFA_CODE);
    }
  }
}
