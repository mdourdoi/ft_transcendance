import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { fileTypeFromFile } from 'file-type';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { TwofaVerifierService } from '../auth/twofa-verifier.service.js';
import { ErrorCode } from '../common/error-codes.js';
import { MIME_TO_EXT } from '../common/mime-types.js';
import { AVATAR_UPLOAD_DIR } from '../constants.js';
import { Prisma } from '../generated/prisma/client.js';
import { EmailTokenService } from '../mail/email-token.service.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailTokens: EmailTokenService,
    private mail: MailService,
    private config: ConfigService,
    private twofaVerifier: TwofaVerifierService,
  ) {}

  async me(userId: number) {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!row) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
    };
  }

  async update(userId: number, dto: UpdateUserDto) {
    const data: {
      username?: string;
      email?: string;
      emailVerifiedAt?: null;
    } = {};
    if (dto.username) {
      data.username = dto.username;
    }
    if (dto.email) {
      data.email = dto.email;
      data.emailVerifiedAt = null;
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException(ErrorCode.NO_DATA_UPDATED);
    }

    try {
      const row = await this.prisma.user.update({
        where: { id: userId },
        data,
      });
      return {
        id: userId,
        username: row.username,
        email: row.email,
        avatarUrl: row.avatarUrl,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        throw new ConflictException(ErrorCode.USERNAME_OR_EMAIL_ALREADY_TAKEN);
      throw e;
    }
  }

  async updateAvatar(userId: number, filename: string) {
    const type = await fileTypeFromFile(join(AVATAR_UPLOAD_DIR, filename));
    if (!type || !MIME_TO_EXT[type.mime]) {
      await this.removeAvatarFile(filename);
      throw new BadRequestException(ErrorCode.INVALID_FILE_TYPE);
    }

    const current = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!current) {
      await this.removeAvatarFile(filename);
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    const row = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: filename },
    });
    if (current.avatarUrl) {
      await this.removeAvatarFile(current.avatarUrl);
    }
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
    };
  }

  private async removeAvatarFile(filename: string) {
    try {
      await unlink(join(AVATAR_UPLOAD_DIR, filename));
    } catch (e) {
      console.warn('avatar cleanup failed:', e);
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!row) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (dto.newPassword === dto.oldPassword) {
      throw new BadRequestException(ErrorCode.PASSWORD_UNCHANGED);
    }
    const corresponding = await bcrypt.compare(
      dto.oldPassword,
      row.passwordHash,
    );
    if (!corresponding) {
      throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS);
    }

    if (row.twoFactorEnabled) {
      await this.twofaVerifier.assertValidCode(row, dto.code);
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    const newRow = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
    this.mail
      .sendPasswordChanged(newRow.email)
      .catch((e) => console.warn('password changed mail failed:', e));
    return {
      id: userId,
      username: newRow.username,
      email: newRow.email,
      avatarUrl: newRow.avatarUrl,
    };
  }

  async requestDeletion(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);

    await this.emailTokens.createLinkToken(
      userId,
      'ACCOUNT_DELETE',
      60 * 60_000,
      (token) =>
        this.mail.sendAccountDeletionLink(
          user.email,
          `${this.config.get('APP_URL')}/account/delete?token=${token}`,
        ),
    );
  }

  async confirmDeletion(token: string) {
    const userId = await this.emailTokens.consumeLinkToken(
      'ACCOUNT_DELETE',
      token,
    );
    if (!userId) throw new BadRequestException(ErrorCode.INVALID_TOKEN);

    const user = await this.prisma.user.delete({ where: { id: userId } });
    if (user.avatarUrl) {
      await this.removeAvatarFile(user.avatarUrl);
    }
    this.mail
      .sendAccountDeleted(user.email)
      .catch((e) => console.warn('account deleted mail failed:', e));
  }

  async requestEmailVerification(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    if (user.emailVerifiedAt) {
      throw new ConflictException(ErrorCode.EMAIL_ALREADY_VERIFIED);
    }

    await this.emailTokens.createLinkToken(
      userId,
      'EMAIL_VERIFY',
      24 * 60 * 60_000,
      (token) =>
        this.mail.sendEmailVerificationLink(
          user.email,
          `${this.config.get('APP_URL')}/verify-email?token=${token}`,
        ),
    );
  }

  async confirmEmailVerification(token: string) {
    const userId = await this.emailTokens.consumeLinkToken(
      'EMAIL_VERIFY',
      token,
    );
    if (!userId) throw new BadRequestException(ErrorCode.INVALID_TOKEN);

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async exportData(userId: number) {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentRequests: { include: { receiver: { select: { username: true } } } },
        receivedRequests: {
          include: { sender: { select: { username: true } } },
        },
        messages: {
          select: { conversationId: true, content: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!row) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);

    return {
      exportedAt: new Date(),
      profile: {
        id: row.id,
        email: row.email,
        username: row.username,
        avatarUrl: row.avatarUrl,
        createdAt: row.createdAt,
        emailVerifiedAt: row.emailVerifiedAt,
        twoFactorEnabled: row.twoFactorEnabled,
        twoFactorMethod: row.twoFactorMethod,
      },
      friendships: [
        ...row.sentRequests.map((f) => ({
          with: f.receiver.username,
          direction: 'sent',
          status: f.status,
          createdAt: f.createdAt,
        })),
        ...row.receivedRequests.map((f) => ({
          with: f.sender.username,
          direction: 'received',
          status: f.status,
          createdAt: f.createdAt,
        })),
      ],
      messages: row.messages,
    };
  }
}
