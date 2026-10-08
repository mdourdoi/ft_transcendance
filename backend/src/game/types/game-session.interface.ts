import { QueueMode } from '../../generated/prisma/client.js';
import { GameSnapshot, Victory } from '../domain/index.js';

export type GameStatus = 'WAITING' | 'PLAYING' | 'OVER';

export type GameEndReason =
  Victory | 'RESIGNATION' | 'DISCONNECTION' | 'TIMEOUT' | 'CANCELLED';

export interface GameSession {
  matchId: number;
  mode: QueueMode;
  playerIds: [number, number];
  botLevel: number | null;
  status: GameStatus;
  joined: [boolean, boolean];
  joinDeadline: number;
  disconnectDeadlines: [number | null, number | null];
  clocks: [number, number];
  turnStartedAt: number | null;
  game: GameSnapshot;
  cards: string[];
  moves: number[];
  winnerId: number | null;
  endReason: GameEndReason | null;
}

export interface CardView {
  name: string;
  color: string;
  moves: number[][];
}

export interface PlayView {
  card: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
}

export interface GameStateView {
  matchId: number;
  mode: QueueMode;
  status: GameStatus;
  playerIds: [number, number];
  board: number[][];
  hands: [CardView[], CardView[]];
  neutral: CardView;
  currentPlayer: number;
  turn: number;
  clocks: [number, number];
  turnStartedAt: number | null;
  legalMoves: PlayView[];
  winnerId: number | null;
  endReason: GameEndReason | null;
}
