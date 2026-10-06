import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  card,
  decodeReplay,
  drawGameCards,
  encodeReplay,
  Game,
  GameError,
  getAllCards,
  packMove,
  Spread,
  unpackMove,
} from '../src/game/domain/index.js';

describe('Replay', () => {
  it('packs every card and square pair into two bytes', () => {
    for (const { name } of getAllCards()) {
      for (let a = 0; a < 25; a++) {
        for (let b = 0; b < 25; b++) {
          if (a === b) {
            continue;
          }
          const from = { row: Math.floor(a / 5), col: a % 5 };
          const to = { row: Math.floor(b / 5), col: b % 5 };
          const packed = packMove(name, from, to);

          assert.ok(packed >= 0 && packed <= 0xffff);
          assert.deepEqual(unpackMove(packed), { card: name, from, to });
        }
      }
    }
  });

  it('round trips the opening cards, moves and passes', () => {
    const cards = ['Tiger', 'Cobra', 'Eel', 'Boar', 'Crane'];
    const from = { row: 4, col: 2 };
    const to = { row: 2, col: 2 };
    const bytes = encodeReplay(cards, [
      packMove('Tiger', from, to),
      packMove('Cobra'),
    ]);

    assert.equal(bytes.length, 9);
    assert.deepEqual(decodeReplay(bytes), {
      hands: [
        ['Tiger', 'Cobra'],
        ['Eel', 'Boar'],
      ],
      neutral: 'Crane',
      moves: [
        { card: 'Tiger', from, to },
        { card: 'Cobra', from: null, to: null },
      ],
    });
  });
});

describe('Game snapshot', () => {
  it('restores the same game it was taken from', () => {
    const game = Game.start(drawGameCards(), { firstPlayer: 0 });
    const next = game.play(game.legalMoves()[0]);

    const restored = Game.restore(next.toSnapshot());

    assert.deepEqual(restored.toSnapshot(), next.toSnapshot());
    assert.deepEqual(
      restored.legalMoves().map((play) => play.card),
      next.legalMoves().map((play) => play.card),
    );
  });

  it('survives a JSON round trip', () => {
    const game = Game.start(drawGameCards(), { firstPlayer: 1 });
    const snapshot = JSON.parse(JSON.stringify(game.toSnapshot()));

    assert.deepEqual(Game.restore(snapshot).toSnapshot(), game.toSnapshot());
  });

  it('rejects an invalid current player', () => {
    const snapshot = Game.start(drawGameCards()).toSnapshot();

    assert.throws(
      () => Game.restore({ ...snapshot, currentPlayer: 2 }),
      GameError,
    );
  });

  it('rejects hands without exactly two cards', () => {
    const [a, b, c, d, e] = drawGameCards();

    assert.throws(() => Spread.restore([[a, b, c], [d]], e), GameError);
  });

  it('rejects unknown cards', () => {
    const snapshot = Game.start(drawGameCards()).toSnapshot();

    assert.throws(() => Game.restore({ ...snapshot, neutral: 'NOT_A_CARD' }));
    assert.ok(card(snapshot.neutral));
  });
});
