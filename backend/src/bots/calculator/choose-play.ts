import { Game, Play } from '../../game/domain/index.js';
import { evaluate } from './evaluate.js';

const SEARCH_DEPTH = 5;
const WIN_SCORE = 1_000_000;

export interface Turn {
  card: string;
  play: Play | null;
}

export function chooseTurn(game: Game): Turn {
  const candidates = turns(game);
  console.log(`Found ${candidates.length} candidate turns`);
  let best = candidates[0];
  let bestScore = -Infinity;

  for (const turn of candidates) {
    const score = outcome(game, turn, SEARCH_DEPTH, bestScore, Infinity);
    if (score > bestScore) {
      best = turn;
      bestScore = score;
      console.log(`Evaluating turn: ${JSON.stringify(best)}`);
    }
  }

  return best;
}

function search(
  game: Game,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (depth === 0) {
    return evaluate(game, game.currentPlayer);
  }

  let best = -Infinity;
  for (const turn of turns(game)) {
    best = Math.max(best, outcome(game, turn, depth, alpha, beta));
    alpha = Math.max(alpha, best);
    if (alpha >= beta) {
      break;
    }
  }
  return best;
}

function outcome(
  game: Game,
  turn: Turn,
  depth: number,
  alpha: number,
  beta: number,
): number {
  const next = turn.play ? game.play(turn.play) : game.pass(turn.card);
  if (next.isOver) {
    return WIN_SCORE + depth;
  }
  return -search(next, depth - 1, -beta, -alpha);
}

function turns(game: Game): Turn[] {
  const plays = game.legalMoves();
  if (plays.length === 0) {
    return game.spread
      .handOf(game.currentPlayer)
      .map((card) => ({ card: card.name, play: null }));
  }
  return plays
    .map((play) => ({ card: play.card, play, capture: captured(game, play) }))
    .sort((a, b) => b.capture - a.capture);
}

function captured(game: Game, play: Play): number {
  const target = game.map.entityAt(play.to);
  if (!target) {
    return 0;
  }
  return target.isMaster ? 2 : 1;
}
