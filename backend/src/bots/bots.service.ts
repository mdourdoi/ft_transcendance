import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '../common/error-codes.js';
import { GameService } from '../game/game.service.js';
import { QueueMode } from '../generated/prisma/client.js';
import { MatchesService } from '../matches/matches.service.js';
import { QueueService } from '../queue/queue.service.js';

@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);

  constructor(
    private readonly matchesService: MatchesService,
    private readonly gameService: GameService,
    private readonly queueService: QueueService,
  ) {}

  async startMatch(userId: number) {
    if (await this.matchesService.findActiveForUser(userId)) {
      throw new ConflictException(ErrorCode.ALREADY_IN_MATCH);
    }

    await this.queueService.leaveAllModes(userId);
    const match = await this.matchesService.createMatch(
      QueueMode.BOT,
      userId,
      null,
    );
    await this.gameService.createSession(match).catch((error: Error) => {
      this.logger.warn(
        `could not create game session for match ${match.id}: ${error.message}`,
      );
    });
    return { matchId: match.id, mode: match.mode };
  }
}
