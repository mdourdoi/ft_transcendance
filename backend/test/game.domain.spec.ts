import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  card,
  drawGameCards,
  Game,
  GameError,
  Spread,
} from '../src/game/domain/index.js';

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
