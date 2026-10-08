import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyseReplay } from '../src/bots/calculator/analyse.js';
import { Replay } from '../src/game/domain/index.js';

const OPENING: Pick<Replay, 'hands' | 'neutral'> = {
  hands: [
    ['Tiger', 'Crab'],
    ['Elephant', 'Frog'],
  ],
  neutral: 'Dragon',
};

describe('analyseReplay', () => {
  it('rates the opening position alone when nothing was played', () => {
    const advantages = analyseReplay({ ...OPENING, moves: [] });

    assert.equal(advantages.length, 1);
    assert.ok(advantages[0] > 0 && advantages[0] < 100);
  });

  it('rates every position of the game', () => {
    const advantages = analyseReplay({
      ...OPENING,
      moves: [
        { card: 'Crab', from: { row: 4, col: 2 }, to: { row: 3, col: 2 } },
        { card: 'Elephant', from: { row: 0, col: 0 }, to: { row: 1, col: 1 } },
        { card: 'Tiger', from: { row: 3, col: 2 }, to: { row: 1, col: 2 } },
      ],
    });

    assert.equal(advantages.length, 4);
    assert.ok(advantages.every((value) => value >= 0 && value <= 100));
  });

  it('gives everything to the winner once the master is captured', () => {
    const advantages = analyseReplay({
      hands: [
        ['Tiger', 'Mantis'],
        ['Elephant', 'Frog'],
      ],
      neutral: 'Dragon',
      moves: [
        { card: 'Tiger', from: { row: 4, col: 2 }, to: { row: 2, col: 2 } },
        { card: 'Elephant', from: { row: 0, col: 0 }, to: { row: 1, col: 1 } },
        { card: 'Mantis', from: { row: 2, col: 2 }, to: { row: 1, col: 3 } },
        { card: 'Tiger', from: { row: 0, col: 4 }, to: { row: 2, col: 4 } },
        { card: 'Elephant', from: { row: 1, col: 3 }, to: { row: 0, col: 2 } },
      ],
    });

    assert.deepEqual(advantages.slice(-2), [100, 100]);
  });

  it('stops at the first move it cannot replay', () => {
    const advantages = analyseReplay({
      ...OPENING,
      moves: [
        { card: 'Crab', from: { row: 4, col: 2 }, to: { row: 3, col: 2 } },
        { card: 'Tiger', from: { row: 0, col: 0 }, to: { row: 1, col: 0 } },
      ],
    });

    assert.equal(advantages.length, 2);
  });
});
