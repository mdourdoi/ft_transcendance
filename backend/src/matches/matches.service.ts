import { ConflictException, Injectable } from '@nestjs/common';
import {
  Match,
  MatchEndReason,
  MatchStatus,
  Prisma,
  QueueMode,
} from '../generated/prisma/client.js';
import { ErrorCode } from '../common/error-codes.js';
import { DEFAULT_AVATAR_FILENAME } from '../constants.js';
import { decodeReplay } from '../game/domain/index.js';
import { MatchHistoryPageDto } from './dto/match-history.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

const RATING_K_FACTOR = 32;
const MIN_RATING = 0;
const HISTORY_PAGE_SIZE = 25;
const OPPONENT_SELECT = { id: true, username: true, avatarUrl: true };

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  createMatch(mode: QueueMode, playerOneId: number, playerTwoId: number) {
    return this.prisma.match.create({
      data: { mode, playerOneId, playerTwoId },
    });
  }

  findById(matchId: number): Promise<Match | null> {
    return this.prisma.match.findUnique({ where: { id: matchId } });
  }

  findActiveForUser(userId: number): Promise<Match | null> {
    return this.prisma.match.findFirst({
      where: {
        status: MatchStatus.ACTIVE,
        OR: [{ playerOneId: userId }, { playerTwoId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findHistoryForUser(
    userId: number,
    cursor?: number,
  ): Promise<MatchHistoryPageDto> {
    const rows = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        OR: [{ playerOneId: userId }, { playerTwoId: userId }],
      },
      orderBy: [{ finishedAt: 'desc' }, { id: 'desc' }],
      take: HISTORY_PAGE_SIZE + 1,
      ...(cursor !== undefined && { cursor: { id: cursor }, skip: 1 }),
      include: {
        playerOne: { select: OPPONENT_SELECT },
        playerTwo: { select: OPPONENT_SELECT },
      },
    });
    const page = rows.slice(0, HISTORY_PAGE_SIZE);
    const matches = page.map((match) => {
      const playerIndex = match.playerOneId === userId ? 0 : 1;
      const opponent = playerIndex === 0 ? match.playerTwo : match.playerOne;
      return {
        id: match.id,
        mode: match.mode,
        endReason: match.endReason,
        ratingDelta: match.ratingDelta,
        createdAt: match.createdAt,
        finishedAt: match.finishedAt,
        playerIndex,
        won: match.winnerId === userId,
        opponent: {
          ...opponent,
          avatarUrl: opponent.avatarUrl ?? DEFAULT_AVATAR_FILENAME,
        },
        replay: match.replay ? decodeReplay(match.replay) : null,
      };
    });
    return {
      matches,
      nextCursor:
        rows.length > HISTORY_PAGE_SIZE ? page[page.length - 1].id : null,
    };
  }

  findActiveCreatedBefore(date: Date): Promise<Match[]> {
    return this.prisma.match.findMany({
      where: { status: MatchStatus.ACTIVE, createdAt: { lt: date } },
    });
  }

  finishMatch(
    matchId: number,
    winnerId: number,
    endReason: MatchEndReason,
    replay?: Uint8Array<ArrayBuffer>,
  ): Promise<Match> {
    return this.prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({ where: { id: matchId } });
      if (!match) {
        throw new ConflictException(ErrorCode.MATCH_NOT_FOUND);
      }
      if (
        match.status === MatchStatus.FINISHED &&
        match.winnerId === winnerId
      ) {
        return match;
      }
      if (winnerId !== match.playerOneId && winnerId !== match.playerTwoId) {
        throw new ConflictException(ErrorCode.IMPOSSIBLE_REQUEST);
      }

      const { count } = await tx.match.updateMany({
        where: { id: matchId, status: MatchStatus.ACTIVE },
        data: {
          status: MatchStatus.FINISHED,
          winnerId,
          endReason,
          replay,
          finishedAt: new Date(),
        },
      });
      if (count === 0) {
        throw new ConflictException(ErrorCode.MATCH_NOT_ACTIVE);
      }

      const ratingDelta =
        match.mode === QueueMode.RANKED
          ? await this.applyRatingChange(tx, match, winnerId)
          : null;

      return tx.match.update({
        where: { id: matchId },
        data: { ratingDelta },
      });
    });
  }

  async cancelMatch(matchId: number): Promise<boolean> {
    const { count } = await this.prisma.match.updateMany({
      where: { id: matchId, status: MatchStatus.ACTIVE },
      data: { status: MatchStatus.CANCELLED, finishedAt: new Date() },
    });
    if (count > 0) {
      return true;
    }
    const match = await this.findById(matchId);
    return match?.status === MatchStatus.CANCELLED;
  }

  private async applyRatingChange(
    tx: Prisma.TransactionClient,
    match: Match,
    winnerId: number,
  ): Promise<number> {
    const loserId =
      winnerId === match.playerOneId ? match.playerTwoId : match.playerOneId;
    const winner = await tx.user.findUniqueOrThrow({ where: { id: winnerId } });
    const loser = await tx.user.findUniqueOrThrow({ where: { id: loserId } });

    const expectedScore =
      1 / (1 + 10 ** ((loser.rating - winner.rating) / 400));
    const delta = Math.round(RATING_K_FACTOR * (1 - expectedScore));

    await tx.user.update({
      where: { id: winnerId },
      data: { rating: { increment: delta } },
    });
    await tx.user.update({
      where: { id: loserId },
      data: { rating: { decrement: delta } },
    });
    await tx.user.updateMany({
      where: { id: loserId, rating: { lt: MIN_RATING } },
      data: { rating: MIN_RATING },
    });
    return delta;
  }
}
