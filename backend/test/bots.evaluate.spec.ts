import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluate } from '../src/bots/calculator/evaluate.js';
import { Game, GameSnapshot } from '../src/game/domain/index.js';

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

describe('evaluate', () => {
  it('scores only mobility in a quiet and even position', () => {
    const game = position([
      [0, 0, -2, 0, 0],
      [0, 0, 0, 0, -1],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [0, 0, 2, 0, 0],
    ]);

    assert.equal(evaluate(game, 0), -2);
    assert.equal(evaluate(game, 1), 2);
  });

  it('rewards an attacked student left without defender', () => {
    const game = position([
      [0, 0, -2, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, -1, 0, 0],
      [1, 0, 0, 0, 0],
      [0, 0, 2, 0, 0],
    ]);

    assert.equal(evaluate(game, 0), 6);
    assert.equal(evaluate(game, 1), -6);
  });

  it('counts the material difference', () => {
    const game = position([
      [0, 0, -2, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [0, 0, 2, 0, 0],
    ]);

    assert.equal(evaluate(game, 0), 110);
    assert.equal(evaluate(game, 1), -110);
  });

  it('punishes an attacked master and a reachable temple', () => {
    const game = position([
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, -2, 0, 0, 0],
      [0, 0, 2, 0, 0],
    ]);

    assert.equal(evaluate(game, 0), -854);
    assert.equal(evaluate(game, 1), 54);
  });

  it('is decided once the game is won', () => {
    const game = position(
      [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 2, 0, 0],
      ],
      { winner: 0, victory: 'WAY_OF_STONE' },
    );

    assert.equal(evaluate(game, 0), Infinity);
    assert.equal(evaluate(game, 1), -Infinity);
  });
});
