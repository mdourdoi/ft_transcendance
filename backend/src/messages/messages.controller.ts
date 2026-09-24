import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { ConversationDto } from './dto/conversation.dto.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { MessageDto } from './dto/message.dto.js';
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

  /**
   * Send a message to a conversation, as an author.
   *
   * @param dto The message object passed as a validated DTO to create a message (send).
   * @returns An object containing the created message.
   * @example POST localhost:5173/conversations/17/send {...}
   */
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  public send(
    @CurrentUser('sub') userId: number,
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() dto: CreateMessageDto,
  ): Promise<MessageDto> {
    return this.messagesService.sendMessage(
      userId,
      conversationId,
      dto.content,
    );
  }
}
