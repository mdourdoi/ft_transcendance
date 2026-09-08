import { Injectable } from '@nestjs/common';
import { FriendshipStatus, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DEFAULT_AVATAR_URL } from '../constants';
import { FriendshipDto } from './dto/friendship.dto';

@Injectable()
export class FriendshipsService {
  constructor(private readonly prisma: PrismaService) {}

  public async getFriendships(
    userId: number,
    statusList: FriendshipStatus[] = [
      FriendshipStatus.ACCEPTED,
      FriendshipStatus.PENDING,
    ],
  ): Promise<FriendshipDto[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: {
          in: statusList,
        },
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
    const users: Set<number> = new Set();
    const res: FriendshipDto[] = [];

    for (const friendship of friendships) {
      let toUse: User | null = null;
      if (friendship.receiverId === userId) toUse = friendship.sender;
      else toUse = friendship.receiver;

      if (toUse && !users.has(toUse.id))
        res.push({
          status: friendship.status,
          conversationId: friendship.conversationId,
          user: { username: toUse.username, avatarUrl: DEFAULT_AVATAR_URL },
          isSender:
            friendship.status === FriendshipStatus.PENDING
              ? friendship.senderId === userId
              : null,
        });
    }

    return res;
  }
}
