import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DEFAULT_AVATAR_URL } from 'src/constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorCode } from '../common/error-codes';
import { ConversationDto } from './dto/conversation.dto';
import { MessageDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  public async getMessages(
    conversationId: number,
    cursor?: string,
    take: number = 20,
  ): Promise<ConversationDto> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      take: take + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true } },
      },
    });

    const hasMore = messages.length > take;
    const items = hasMore ? messages.slice(0, take) : messages;
    const itemsDto: MessageDto[] = [];

    for (const item of items.reverse()) {
      const dto = new MessageDto({
        id: item.id,
        content: item.content,
        createdAt: item.createdAt,
        sender: {
          username: item.sender.username,
          // TODO, waiting for the avatar system
          avatarUrl: DEFAULT_AVATAR_URL,
        },
      });
      itemsDto.push(dto);
    }

    return {
      items: itemsDto,
      nextCursor: hasMore ? items[0].id : null,
      hasMore,
    };
  }

  public async sendMessage(
    userId: number,
    conversationId: number,
    senderId: number,
    content: string,
  ): Promise<MessageDto> {
    const sender = await this.prisma.user.findUnique({
      where: {
        id: senderId,
      },
    });
    if (!sender) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    if (userId !== sender.id)
      throw new ForbiddenException(ErrorCode.INVALID_USER);

    const created = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
      },
    });

    return {
      id: created.id,
      createdAt: created.createdAt,
      content: created.content,
      sender: {
        username: sender.username,
        // TODO, waiting for the avatar system
        avatarUrl: DEFAULT_AVATAR_URL,
      },
    };
  }
}
