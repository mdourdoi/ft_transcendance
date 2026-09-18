import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Match, MatchStatus, QueueMode } from '@prisma/client';
import { ErrorCode } from '../common/error-codes';
import { PrismaService } from '../prisma/prisma.service';

const RATING_K_FACTOR = 32;

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  createMatch(mode: QueueMode, playerOneId: number, playerTwoId: number) {
    return this.prisma.match.create({
      data: { mode, playerOneId, playerTwoId },
    });
  }

  async reportResult(
    matchId: number,
    userId: number,
    winnerId: number,
  ): Promise<Match> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException(ErrorCode.MATCH_NOT_FOUND);
    }
    if (match.playerOneId !== userId && match.playerTwoId !== userId) {
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);
    }
    if (match.status !== MatchStatus.ACTIVE) {
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);
    }
    if (winnerId !== match.playerOneId && winnerId !== match.playerTwoId) {
      throw new ForbiddenException(ErrorCode.IMPOSSIBLE_REQUEST);
    }

    if (match.mode === QueueMode.RANKED) {
      await this.applyRatingChange(match, winnerId);
    }

    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.FINISHED, winnerId, finishedAt: new Date() },
    });
  }

  private async applyRatingChange(match: Match, winnerId: number) {
    const loserId =
      winnerId === match.playerOneId ? match.playerTwoId : match.playerOneId;
    const [winner, loser] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: winnerId } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: loserId } }),
    ]);

    const expectedScore =
      1 / (1 + 10 ** ((loser.rating - winner.rating) / 400));
    const delta = Math.round(RATING_K_FACTOR * (1 - expectedScore));

    await Promise.all([
      this.prisma.user.update({
        where: { id: winnerId },
        data: { rating: { increment: delta } },
      }),
      this.prisma.user.update({
        where: { id: loserId },
        data: { rating: { decrement: delta } },
      }),
    ]);
  }
}
