import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { ErrorCode } from '../common/error-codes.js';
import { acquireLock, releaseLock } from '../common/redis-lock.js';
import {
  Friendship,
  FriendshipStatus,
  User,
} from '../generated/prisma/client.js';
import { MessagesService } from '../messages/messages.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { REDIS_CLIENT } from '../redis/redis.constants.js';
import { AcceptRequestDto } from './dto/accept-request.dto.js';
import { BlockUserDto } from './dto/block-user.dto.js';
import { CancelPendingRequestDto } from './dto/cancel-pending-request.dto.js';
import { DenyRequestDto } from './dto/deny-request.dto.js';
import { FriendRequestDto } from './dto/friend-request.dto.js';
import { FriendshipDto } from './dto/friendship.dto.js';
import { RemoveFriendDto } from './dto/remove-friend.dto.js';
import { UnblockUserDto } from './dto/unblock-user.dto.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

const LOCK_TTL_MS = 5000;
const LOCK_RETRY_MS = 25;
const LOCK_MAX_ATTEMPTS = 120;

@Injectable()
export class FriendshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
    private eventEmitter: EventEmitter2,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

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
          conversationId: friendship.conversation?.id || null,
          user: {
            id: toUse.id,
            username: toUse.username,
            avatarUrl: toUse.avatarUrl,
          },
          isSender:
            friendship.status === FriendshipStatus.PENDING ||
            friendship.status === FriendshipStatus.BLOCKED
              ? friendship.senderId === userId
              : null,
        });
        users.add(toUse.id);
      }
    }

    return res;
  }

  public async sendRequest(userId: number, dto: FriendRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
      select: { id: true },
    });
    if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);

    const targetId = user.id;
    if (userId === targetId)
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

    return this.withPairLock_(userId, targetId, () =>
      this.sendRequest_(userId, targetId),
    );
  }

  private async sendRequest_(userId: number, targetId: number) {
    if (
      !(await this.mustBe_(userId, targetId, [
        'not_blocked_by',
        'not_friend_with',
      ]))
    )
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

    const currentFriendship = await this.getFriendship_(userId, targetId);
    if (!currentFriendship) {
      await this.prisma.friendship.create({
        data: {
          senderId: userId,
          receiverId: targetId,
          status: FriendshipStatus.PENDING,
        },
      });
      await this.emitFriendshipEvent_('friendship.requested', targetId, userId);
      return;
    }

    if (await this.mustBe_(targetId, userId, ['requested']))
      return await this.startFriendship_(userId, targetId);

    throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);
  }

  public async cancelRequest(userId: number, dto: CancelPendingRequestDto) {
    return this.withPairLock_(userId, dto.targetId, async () => {
      if (!(await this.mustBe_(userId, dto.targetId, ['requested'])))
        throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

      await this.deleteFriendship_(userId, dto.targetId);
      await this.emitFriendshipEvent_(
        'friendship.cancelled',
        dto.targetId,
        userId,
      );
    });
  }

  public async acceptRequest(userId: number, dto: AcceptRequestDto) {
    return this.withPairLock_(userId, dto.targetId, async () => {
      if (!(await this.mustBe_(dto.targetId, userId, ['requested'])))
        throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

      await this.startFriendship_(userId, dto.targetId);
    });
  }

  public async denyRequest(userId: number, dto: DenyRequestDto) {
    return this.withPairLock_(userId, dto.targetId, async () => {
      if (!(await this.mustBe_(dto.targetId, userId, ['requested'])))
        throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

      await this.deleteFriendship_(userId, dto.targetId);
      await this.emitFriendshipEvent_(
        'friendship.denied',
        dto.targetId,
        userId,
      );
    });
  }

  public async removeFriend(userId: number, dto: RemoveFriendDto) {
    return this.withPairLock_(userId, dto.targetId, async () => {
      if (!(await this.mustBe_(userId, dto.targetId, ['friend_with'])))
        throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

      await this.deleteFriendship_(userId, dto.targetId);
      await this.emitFriendshipEvent_(
        'friendship.removed',
        dto.targetId,
        userId,
      );
    });
  }

  public async blockUser(userId: number, dto: BlockUserDto) {
    return this.withPairLock_(userId, dto.targetId, async () => {
      if (
        userId === dto.targetId ||
        !(await this.mustBe_(userId, dto.targetId, ['not_blocked_by']))
      )
        throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

      const user = await this.prisma.user.findUnique({
        where: {
          id: dto.targetId,
        },
      });
      if (!user) throw new NotFoundException(ErrorCode.USER_NOT_FOUND);

      const currentFs = await this.getFriendship_(userId, dto.targetId);
      if (!currentFs) {
        await this.prisma.friendship.create({
          data: {
            senderId: userId,
            receiverId: dto.targetId,
            status: FriendshipStatus.BLOCKED,
          },
        });
        await this.emitFriendshipEvent_(
          'friendship.blocked',
          dto.targetId,
          userId,
        );
      } else {
        await this.messagesService.deleteConversationForFriendship(
          currentFs?.id,
        );
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
        await this.emitFriendshipEvent_(
          currentFs.status === FriendshipStatus.ACCEPTED
            ? 'friendship.removed'
            : 'friendship.blocked',
          dto.targetId,
          userId,
        );
      }
    });
  }

  public async unblockUser(userId: number, dto: UnblockUserDto) {
    return this.withPairLock_(userId, dto.targetId, async () => {
      if (!(await this.mustBe_(dto.targetId, userId, ['blocked_by'])))
        throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

      await this.deleteFriendship_(userId, dto.targetId);
    });
  }

  public areFriends(userId: number, targetId: number): Promise<boolean> {
    return this.mustBe_(userId, targetId, ['friend_with']);
  }

  private async startFriendship_(A: number, B: number) {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.friendship.updateMany({
        where: { senderId: B, receiverId: A, status: FriendshipStatus.PENDING },
        data: { status: FriendshipStatus.ACCEPTED },
      });
      const friendship =
        count === 1
          ? await tx.friendship.findFirst({
              where: { senderId: B, receiverId: A },
            })
          : null;
      if (!friendship)
        throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);

      await this.messagesService.createConversationForFriendship(
        friendship.id,
        tx,
      );
    });
    await this.emitFriendshipEvent_('friendship.accepted', B, A);
  }

  private async withPairLock_<T>(
    A: number,
    B: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const key = `friendship:lock:${Math.min(A, B)}:${Math.max(A, B)}`;
    for (let attempt = 0; attempt < LOCK_MAX_ATTEMPTS; attempt++) {
      const token = await acquireLock(this.redis, key, LOCK_TTL_MS);
      if (token) {
        try {
          return await fn();
        } finally {
          await releaseLock(this.redis, key, token);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_MS));
    }
    throw new ConflictException(ErrorCode.IMPOSSIBLE_REQUEST);
  }

  private async emitFriendshipEvent_(
    event: string,
    targetId: number,
    fromId: number,
  ) {
    const expeditor = await this.prisma.user.findUnique({
      where: { id: fromId },
      select: { id: true, username: true, avatarUrl: true },
    });
    if (expeditor) {
      this.eventEmitter.emit(event, {
        targetId,
        from: {
          id: expeditor.id,
          username: expeditor.username,
          avatarUrl: expeditor.avatarUrl,
        },
      });
    }
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
