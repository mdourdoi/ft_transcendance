import {
  card,
  Game,
  GameError,
  Play,
  Position,
  Replay,
} from '../../game/domain/index.js';
import { assess } from './choose-play.js';

const ANALYSIS_DEPTH = 3;
const ADVANTAGE_SCALE = 150;

export function analyseReplay(replay: Replay): number[] {
  let game = Game.start(
    [...replay.hands[0], ...replay.hands[1], replay.neutral].map(card),
  );
  const advantages = [advantage(game)];

  try {
    for (const move of replay.moves) {
      game =
        move.from && move.to
          ? game.play(
              Play.create({
                card: move.card,
                from: Position.create(move.from),
                to: Position.create(move.to),
              }),
            )
          : game.pass(move.card);
      advantages.push(advantage(game));
    }
  } catch (error) {
    if (!(error instanceof GameError)) {
      throw error;
    }
  }

  return advantages;
}

function advantage(game: Game): number {
  if (game.winner !== null) {
    return game.winner === 0 ? 100 : 0;
  }
  const score =
    (assess(game, ANALYSIS_DEPTH) + assess(game, ANALYSIS_DEPTH - 1)) / 2;
  const forFirstPlayer = game.currentPlayer === 0 ? score : -score;
  return Math.round(100 / (1 + Math.exp(-forFirstPlayer / ADVANTAGE_SCALE)));
}
