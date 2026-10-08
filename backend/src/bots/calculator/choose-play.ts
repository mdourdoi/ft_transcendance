import { Game, Play } from '../../game/domain/index.js';
import { evaluate } from './evaluate.js';

const WIN_SCORE = 1_000_000;
const SOFTMAX_CUTOFF = 6;

export interface Turn {
  card: string;
  play: Play | null;
}

export interface BotLevel {
  depth: number;
  temperature: number;
}

export function chooseTurn(
  game: Game,
  level: BotLevel,
  random: () => number = Math.random,
): Turn {
  const candidates = turns(game);
  const margin = level.temperature * SOFTMAX_CUTOFF;
  const scores: number[] = [];
  let best = -Infinity;

  for (const turn of candidates) {
    const score = outcome(game, turn, level.depth, best - margin, Infinity);
    scores.push(score);
    best = Math.max(best, score);
  }

  const weights = scores.map((score) =>
    score > best - margin ? Math.exp((score - best) / level.temperature) : 0,
  );
  let roll = random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (const [index, weight] of weights.entries()) {
    roll -= weight;
    if (roll < 0) {
      return candidates[index];
    }
  }
  return candidates[scores.indexOf(best)];
}

export function assess(game: Game, depth: number): number {
  return search(game, depth, -Infinity, Infinity);
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
