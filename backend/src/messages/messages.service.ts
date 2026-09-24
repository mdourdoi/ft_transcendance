import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../common/error-codes.js';
import { DEFAULT_AVATAR_URL } from '../constants.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConversationDto } from './dto/conversation.dto.js';
import { MessageDto } from './dto/message.dto.js';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  public async getMessages(
    userId: number,
    conversationId: number,
    cursor?: string,
    take: number = 20,
  ): Promise<ConversationDto> {
    if (!(await this.hasAccess_(userId, conversationId)))
      throw new ForbiddenException(ErrorCode.FORBIDDEN_CONVERSATION);
    const cursorObject = cursor
      ? await this.prisma.message.findUnique({ where: { id: cursor } })
      : undefined;
    if (cursor && cursorObject?.conversationId !== conversationId)
      cursor = undefined;

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      take: take + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
          id: item.sender.id,
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
    content: string,
  ): Promise<MessageDto> {
    const sender = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!sender) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    if (!(await this.hasAccess_(userId, conversationId)))
      throw new ForbiddenException(ErrorCode.FORBIDDEN_CONVERSATION);
    content = content.trim();
    if (!content.length) throw new BadRequestException(ErrorCode.EMPTY_MESSAGE);

    const created = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
      },
    });

    return {
      id: created.id,
      createdAt: created.createdAt,
      content: created.content,
      sender: {
        id: sender.id,
        username: sender.username,
        // TODO, waiting for the avatar system
        avatarUrl: DEFAULT_AVATAR_URL,
      },
    };
  }

  public async createConversationForFriendship(
    friendshipId: number,
  ): Promise<number> {
    const fs = await this.prisma.friendship.findFirst({
      where: {
        id: friendshipId,
      },
    });
    if (!fs) throw new NotFoundException(ErrorCode.FORBIDDEN_CONVERSATION);

    const conv = await this.prisma.conversation.create({
      data: {
        friendshipId,
      },
    });
    await this.addAccess(fs.senderId, conv.id);
    await this.addAccess(fs.receiverId, conv.id);
    return conv.id;
  }

  public async addAccess(userId: number, conversationId: number) {
    await this.prisma.conversationAccess.create({
      data: { conversationId, userId },
    });
  }

  public async deleteConversationForFriendship(friendshipId: number) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        friendshipId,
      },
    });
    if (!conversation) return;
    await this.prisma.conversation.delete({
      where: {
        id: conversation.id,
      },
    });
  }

  private async hasAccess_(
    userId: number,
    conversationId: number,
  ): Promise<boolean> {
    const conversation = await this.prisma.conversationAccess.findUnique({
      where: {
        conversationId_userId: {
          userId,
          conversationId,
        },
      },
    });
    return !!conversation;
  }
}
