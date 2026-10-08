import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOT_LEVELS } from '../src/bots/bots.constants.js';
import { chooseTurn } from '../src/bots/calculator/choose-play.js';
import { Game, GameSnapshot } from '../src/game/domain/index.js';

const WEAKEST = BOT_LEVELS[0];
const STRONGEST = BOT_LEVELS[BOT_LEVELS.length - 1];
const ROLLS = [0, 0.2, 0.4, 0.6, 0.8, 0.999];

function position(
  board: number[][],
  overrides: Partial<GameSnapshot> = {},
): Game {
  return Game.restore({
    board,
    hands: [
      ['Tiger', 'Crab'],
      ['Elephant', 'Frog'],
    ],
    neutral: 'Dragon',
    currentPlayer: 0,
    turn: 1,
    winner: null,
    victory: null,
    ...overrides,
  });
}

function signature(game: Game, roll: number, level = WEAKEST): string {
  const { card, play } = chooseTurn(game, level, () => roll);
  return play
    ? `${card}:${play.from.row}${play.from.col}-${play.to.row}${play.to.col}`
    : card;
}

describe('chooseTurn', () => {
  const quiet = position([
    [-1, -1, -2, -1, -1],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 1, 2, 1, 1],
  ]);
  const winning = position([
    [0, -1, -2, -1, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 2, 0, 1],
  ]);

  it('levels get deeper and steadier as they rise', () => {
    for (let index = 1; index < BOT_LEVELS.length; index++) {
      assert.ok(BOT_LEVELS[index].depth > BOT_LEVELS[index - 1].depth);
      assert.ok(
        BOT_LEVELS[index].temperature < BOT_LEVELS[index - 1].temperature,
      );
    }
    assert.equal(STRONGEST.temperature, 0);
  });

  it('always plays the same move at the strongest level', () => {
    const moves = new Set(
      ROLLS.map((roll) => signature(quiet, roll, { ...STRONGEST, depth: 3 })),
    );

    assert.equal(moves.size, 1);
  });

  it('varies its moves at a weak level', () => {
    const moves = new Set(ROLLS.map((roll) => signature(quiet, roll)));

    assert.ok(moves.size > 1);
  });

  it('only plays legal moves at a weak level', () => {
    const legal = quiet
      .legalMoves()
      .map(
        ({ card, from, to }) =>
          `${card}:${from.row}${from.col}-${to.row}${to.col}`,
      );

    for (const roll of ROLLS) {
      assert.ok(legal.includes(signature(quiet, roll)));
    }
  });

  it('never misses an immediate win, whatever the level', () => {
    for (const level of BOT_LEVELS.slice(0, -1)) {
      for (const roll of ROLLS) {
        assert.equal(signature(winning, roll, level), 'Tiger:22-02');
      }
    }
  });
});
