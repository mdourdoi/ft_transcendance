import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { ErrorCode } from '../common/error-codes.js';
import { FriendshipsService } from '../friendships/friendships.service.js';
import { GameService } from '../game/game.service.js';
import { QueueMode } from '../generated/prisma/client.js';
import { MatchesService } from '../matches/matches.service.js';
import { QueueService } from '../queue/queue.service.js';
import { REDIS_CLIENT } from '../redis/redis.constants.js';
import { UsersService } from '../users/users.service.js';

export const INVITE_TTL_SECONDS = 60;

@Injectable()
export class GameInvitesService {
  private readonly logger = new Logger(GameInvitesService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly friendshipsService: FriendshipsService,
    private readonly usersService: UsersService,
    private readonly matchesService: MatchesService,
    private readonly gameService: GameService,
    private readonly queueService: QueueService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async send(userId: number, targetId: number) {
    await this.requireFriends(userId, targetId);
    if (await this.matchesService.findActiveForUser(userId)) {
      throw new ConflictException(ErrorCode.ALREADY_IN_MATCH);
    }

    const expiresAt = Date.now() + INVITE_TTL_SECONDS * 1000;
    const created = await this.redis.set(
      this.inviteKey(userId, targetId),
      String(expiresAt),
      'EX',
      INVITE_TTL_SECONDS,
      'NX',
    );
    if (created !== 'OK') {
      throw new ConflictException(ErrorCode.GAME_INVITE_ALREADY_SENT);
    }

    const sender = await this.usersService.findById(userId);
    this.eventEmitter.emit('gameInvite.sent', {
      targetId,
      from: {
        id: sender.id,
        username: sender.username,
        avatarUrl: sender.avatarUrl,
      },
      expiresAt,
    });
    return { expiresAt };
  }

  async accept(userId: number, senderId: number) {
    await this.claim(senderId, userId);
    await this.requireFriends(userId, senderId);
    if (
      (await this.matchesService.findActiveForUser(userId)) ||
      (await this.matchesService.findActiveForUser(senderId))
    ) {
      throw new ConflictException(ErrorCode.ALREADY_IN_MATCH);
    }

    await this.queueService.leaveAllModes(senderId);
    await this.queueService.leaveAllModes(userId);
    const match = await this.matchesService.createMatch(
      QueueMode.UNRANKED,
      senderId,
      userId,
    );
    await this.gameService.createSession(match).catch((error: Error) => {
      this.logger.warn(
        `could not create game session for match ${match.id}: ${error.message}`,
      );
    });

    this.eventEmitter.emit('gameInvite.accepted', {
      targetId: senderId,
      matchId: match.id,
      opponentId: userId,
    });
    return { matchId: match.id, opponentId: senderId };
  }

  async decline(userId: number, senderId: number) {
    await this.claim(senderId, userId);
    this.eventEmitter.emit('gameInvite.declined', {
      targetId: senderId,
      userId,
    });
  }

  async cancel(userId: number, targetId: number) {
    await this.claim(userId, targetId);
    this.eventEmitter.emit('gameInvite.cancelled', { targetId, userId });
  }

  private async requireFriends(userId: number, targetId: number) {
    if (
      userId === targetId ||
      !(await this.friendshipsService.areFriends(userId, targetId))
    ) {
      throw new ForbiddenException(ErrorCode.NOT_FRIENDS);
    }
  }

  private async claim(senderId: number, receiverId: number) {
    const removed = await this.redis.del(this.inviteKey(senderId, receiverId));
    if (removed === 0) {
      throw new NotFoundException(ErrorCode.GAME_INVITE_NOT_FOUND);
    }
  }

  private inviteKey(senderId: number, receiverId: number): string {
    return `game:invite:${senderId}:${receiverId}`;
  }
}
