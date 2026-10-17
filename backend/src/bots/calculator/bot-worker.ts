import { parentPort } from 'node:worker_threads';
import { Game, GameSnapshot } from '../../game/domain/index.js';
import { BotLevel, chooseTurn } from './choose-play.js';

export interface BotRequest {
  id: number;
  snapshot: GameSnapshot;
  level: BotLevel;
}

export interface BotAnswer {
  id: number;
  card?: string;
  play?: {
    from: { row: number; col: number };
    to: { row: number; col: number };
  } | null;
  error?: string;
}

parentPort?.on('message', ({ id, snapshot, level }: BotRequest) => {
  let answer: BotAnswer;
  try {
    const { card, play } = chooseTurn(Game.restore(snapshot), level);
    answer = {
      id,
      card,
      play: play && {
        from: { row: play.from.row, col: play.from.col },
        to: { row: play.to.row, col: play.to.col },
      },
    };
  } catch (error) {
    answer = { id, error: (error as Error).message };
  }
  parentPort?.postMessage(answer);
});
