import { Global, Module } from '@nestjs/common';
import { EmailTokenService } from './email-token.service.js';
import { MailService } from './mail.service.js';

@Global()
@Module({
  providers: [MailService, EmailTokenService],
  exports: [MailService, EmailTokenService],
})
export class MailModule {}
