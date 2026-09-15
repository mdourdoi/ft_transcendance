import { ForbiddenException, Injectable } from '@nestjs/common';
import { Friendship, FriendshipStatus, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ErrorCode } from '../common/error-codes';
import { DEFAULT_AVATAR_URL } from '../constants';
import { AcceptRequestDto } from './dto/accept-request.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { CancelPendingRequestDto } from './dto/cancel-pending-request.dto';
import { DenyRequestDto } from './dto/deny-request.dto';
import { FriendRequestDto } from './dto/friend-request.dto';
import { FriendshipDto } from './dto/friendship.dto';
import { RemoveFriendDto } from './dto/remove-friend.dto';
import { UnblockUserDto } from './dto/unblock-user.dto';

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
        conversation: true,
      },
    });
    const users: Set<number> = new Set();
    const res: FriendshipDto[] = [];

    for (const friendship of friendships) {
      let toUse: User | null = null;
      if (friendship.receiverId === userId) toUse = friendship.sender;
      else toUse = friendship.receiver;

      if (toUse && !users.has(toUse.id)) {
        res.push({
          status: friendship.status,
          conversationId: friendship.conversation!.id,
          user: { username: toUse.username, avatarUrl: DEFAULT_AVATAR_URL },
          isSender:
            friendship.status === FriendshipStatus.PENDING
              ? friendship.senderId === userId
              : null,
        });
      }
    }

    return res;
  }

  public async sendRequest(userId: number, dto: FriendRequestDto) {
    if (
      userId === dto.targetId ||
      !(await this.mustBe_(userId, dto.targetId, [
        'not_blocked_by',
        'not_friend_with',
      ]))
    )
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

    const currentFriendship = await this.getFriendship_(userId, dto.targetId);
    if (!currentFriendship) {
      await this.prisma.friendship.create({
        data: {
          senderId: userId,
          receiverId: dto.targetId,
          status: FriendshipStatus.PENDING,
        },
      });
      return;
    }

    if (await this.mustBe_(dto.targetId, userId, ['requested'])) {
      await this.updateFriendship_(
        userId,
        dto.targetId,
        FriendshipStatus.ACCEPTED,
      );
      return;
    }
    throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);
  }

  public async cancelRequest(userId: number, dto: CancelPendingRequestDto) {
    if (!(await this.mustBe_(userId, dto.targetId, ['requested'])))
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

    await this.deleteFriendship_(userId, dto.targetId);
  }

  public async acceptRequest(userId: number, dto: AcceptRequestDto) {
    if (!(await this.mustBe_(dto.targetId, userId, ['requested'])))
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

    await this.updateFriendship_(
      userId,
      dto.targetId,
      FriendshipStatus.ACCEPTED,
    );
  }

  public async denyRequest(userId: number, dto: DenyRequestDto) {
    if (!(await this.mustBe_(dto.targetId, userId, ['requested'])))
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

    await this.deleteFriendship_(userId, dto.targetId);
  }

  public async removeFriend(userId: number, dto: RemoveFriendDto) {
    if (!(await this.mustBe_(userId, dto.targetId, ['friend_with'])))
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

    await this.deleteFriendship_(userId, dto.targetId);
  }

  public async blockUser(userId: number, dto: BlockUserDto) {
    if (
      userId === dto.targetId ||
      !(await this.mustBe_(userId, dto.targetId, ['not_blocked_by']))
    )
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

    const currentFs = await this.getFriendship_(userId, dto.targetId);
    if (!currentFs) {
      await this.prisma.friendship.create({
        data: {
          senderId: userId,
          receiverId: dto.targetId,
          status: FriendshipStatus.BLOCKED,
        },
      });
    } else {
      await this.prisma.friendship.updateMany({
        where: {
          OR: [
            { senderId: userId, receiverId: dto.targetId },
            { senderId: dto.targetId, receiverId: userId },
          ],
        },
        data: {
          senderId: userId,
          receiverId: dto.targetId,
          status: FriendshipStatus.BLOCKED,
        },
      });
    }
  }

  public async unblockUser(userId: number, dto: UnblockUserDto) {
    if (!(await this.mustBe_(dto.targetId, userId, ['blocked_by'])))
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

    await this.deleteFriendship_(userId, dto.targetId);
  }

  private getFriendship_(A: number, B: number): Promise<Friendship | null> {
    return this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: A, receiverId: B },
          { senderId: B, receiverId: A },
        ],
      },
    });
  }

  private async updateFriendship_(
    A: number,
    B: number,
    status: FriendshipStatus,
  ) {
    await this.prisma.friendship.updateMany({
      where: {
        OR: [
          { senderId: A, receiverId: B },
          { senderId: B, receiverId: A },
        ],
      },
      data: {
        status,
      },
    });
  }

  private async deleteFriendship_(A: number, B: number) {
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: A, receiverId: B },
          { senderId: B, receiverId: A },
        ],
      },
    });
  }

  private async mustBe_(
    A: number,
    B: number,
    status: (
      | 'blocked_by'
      | 'friend_with'
      | 'not_blocked_by'
      | 'not_friend_with'
      | 'requested'
    )[],
  ): Promise<boolean> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            senderId: A,
            receiverId: B,
          },
          {
            senderId: B,
            receiverId: A,
          },
        ],
      },
    });

    const results: boolean[] = [];
    for (const s of status) {
      switch (s) {
        case 'blocked_by':
          results.push(
            (friendship &&
              friendship.status === FriendshipStatus.BLOCKED &&
              friendship.senderId === B &&
              friendship.receiverId === A) ||
              false,
          );
          break;
        case 'friend_with':
          results.push(
            (friendship && friendship.status === FriendshipStatus.ACCEPTED) ||
              false,
          );
          break;
        case 'not_blocked_by':
          results.push(
            !friendship ||
              friendship.status !== FriendshipStatus.BLOCKED ||
              (friendship.status === FriendshipStatus.BLOCKED &&
                friendship.senderId !== B) ||
              false,
          );
          break;
        case 'not_friend_with':
          results.push(
            !friendship ||
              friendship.status !== FriendshipStatus.ACCEPTED ||
              false,
          );
          break;
        case 'requested':
          results.push(
            (friendship &&
              friendship.status === FriendshipStatus.PENDING &&
              friendship.senderId === A &&
              friendship.receiverId === B) ||
              false,
          );
          break;
        default:
          return true;
      }
    }

    return results.every((r) => r === true);
  }
}
