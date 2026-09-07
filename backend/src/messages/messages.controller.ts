import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { ConversationDto } from "./dto/conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";
import { MessageDto } from "./dto/message.dto";
import { MessagesService } from "./messages.service";

@Controller('conversations/:conversationId/')
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
   * @example localhost:5173/conversations/17/messages?cursor=cmtrre39m000004l5czqhae8f&take=20
   */
  @Get('messages')
  @HttpCode(HttpStatus.OK)
  public getMessages(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ): Promise<ConversationDto> {
    return this.messagesService.getMessages(
      conversationId,
      cursor,
      take ? parseInt(take, 10) : 20
    )
  }

  /**
   * Send a message to a conversation, as an author.
   *
   * @param dto The message object passed as a validated DTO to create a message (send).
   * @returns An object containing the created message.
   * @example localhost:5173/conversations/17/send {...}
   */
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  public send(@Body() dto: CreateMessageDto): Promise<MessageDto> {
    return this.messagesService.sendMessage(dto.conversationId, dto.senderId, dto.content);
  }
}