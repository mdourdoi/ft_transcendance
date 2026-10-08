import { Replay } from '../../game/domain/index.js';
import { MatchEndReason, QueueMode } from '../../generated/prisma/client.js';

export interface MatchOpponentDto {
  id: number;
  username: string;
  avatarUrl: string;
}

export interface MatchHistoryDto {
  id: number;
  mode: QueueMode;
  endReason: MatchEndReason | null;
  ratingDelta: number | null;
  createdAt: Date;
  finishedAt: Date | null;
  playerIndex: number;
  won: boolean;
  opponent: MatchOpponentDto;
  replay: Replay | null;
}

export interface MatchHistoryPageDto {
  matches: MatchHistoryDto[];
  nextCursor: number | null;
}

export interface MatchAnalysisDto {
  advantages: number[];
}
