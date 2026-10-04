import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null = null;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.from = config.get<string>('MAIL_FROM')!;
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(config.get('SMTP_PORT')),
        secure: false,
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async onModuleInit() {
    if (!this.transporter) {
      this.logger.warn(
        'SMTP_HOST not set: emails will be printed to the console',
      );
      return;
    }
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection OK');
    } catch (e) {
      this.logger.error(`SMTP unreachable: ${(e as Error).message}`);
    }
  }

  private async send(to: string, subject: string, text: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[MAIL] to=${to} subject="${subject}"\n${text}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      text,
      html,
    });
  }

  public sendTwofaCode(to: string, code: string) {
    return this.send(
      to,
      'Your Transcendence login code',
      `Your code: ${code}\nIt expires in 10 minutes.`,
      `<p>Your code: <b style="font-size:20px">${code}</b></p><p>It expires in 10 minutes.</p>`,
    );
  }

  public sendAccountDeletionLink(to: string, url: string) {
    return this.send(
      to,
      'Confirm your account deletion',
      `Click to permanently delete your account: ${url}\nThis link expires in 1 hour.`,
      `<p><a href="${url}">Permanently delete my account</a></p><p>This link expires in 1 hour.</p>`,
    );
  }

  public sendEmailVerificationLink(to: string, url: string) {
    return this.send(
      to,
      'Verify your email address',
      `Click to verify your email address: ${url}\nThis link expires in 24 hours.`,
      `<p><a href="${url}">Verify my email address</a></p><p>This link expires in 24 hours.</p>`,
    );
  }

  public sendAccountDeleted(to: string) {
    const msg = 'Your account and all associated data have been deleted.';
    return this.send(to, 'Account deleted', msg, `<p>${msg}</p>`);
  }

  public sendPasswordChanged(to: string) {
    const msg =
      "Your password was just changed. If this wasn't you, contact us.";
    return this.send(to, 'Password changed', msg, `<p>${msg}</p>`);
  }
}
