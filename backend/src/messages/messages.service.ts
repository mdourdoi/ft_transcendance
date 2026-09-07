import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  public async getMessages(conversationId: number, cursor?: string, take: number = 20) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      take: take + 1,
      ...(cursor && {
        skip: 1, cursor: { id: cursor }
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true } },
      }
    });

    const hasMore = messages.length > take;
    const items = hasMore ? messages.slice(0, take) : messages;

    return {
      items: items.reverse(),
      nextCursor: hasMore ? items[0].id : null,
      hasMore,
    }
  }
}