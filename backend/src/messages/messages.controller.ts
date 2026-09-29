import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { ConversationDto } from './dto/conversation.dto.js';
import { MessagesService } from './messages.service.js';

@Controller('conversations/:conversationId')
@UseGuards(JwtGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Get the <take> messages from a conversation, based or not on the <cursor> who represents the last loaded
   * message id.
   *
   * @param conversationId The ID of the conversation to scrap.
   * @param cursor The last loaded message ID from the conversation. Set to undefined at first load.
   * @param take The number of messages to load, by default 20.
   * @returns An object containing the list of messages, an indicator if the conversation is fully loaded, and the next cursor.
   * @example GET localhost:5173/conversations/17/messages?take=20&cursor=cmtrre39m000004l5czqhae8f
   */
  @Get('messages')
  @HttpCode(HttpStatus.OK)
  public getMessages(
    @CurrentUser('sub') userId: number,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query('cursor') cursor?: string,
  ): Promise<ConversationDto> {
    return this.messagesService.getMessages(
      userId,
      conversationId,
      cursor,
      Math.min(Math.max(take, 1), 100),
    );
  }
}
