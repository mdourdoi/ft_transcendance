import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { BotPool } from '../src/bots/bot-pool.service.js';
import { BOT_LEVELS } from '../src/bots/bots.constants.js';
import { drawGameCards, Game } from '../src/game/domain/index.js';

describe('BotPool', () => {
  const pool = new BotPool();

  after(() => pool.onModuleDestroy());

  it('answers with a legal move computed off the main thread', async () => {
    const game = Game.start(drawGameCards());

    const { card, play } = await pool.choose(game.toSnapshot(), BOT_LEVELS[0]);

    assert.ok(play);
    assert.ok(
      game
        .legalMoves()
        .some(
          (legal) =>
            legal.card === card &&
            legal.from.row === play.from.row &&
            legal.from.col === play.from.col &&
            legal.to.row === play.to.row &&
            legal.to.col === play.to.col,
        ),
    );
  });

  it('answers several requests at once', async () => {
    const snapshot = Game.start(drawGameCards()).toSnapshot();

    const turns = await Promise.all(
      [0, 1, 2, 3, 4].map(() => pool.choose(snapshot, BOT_LEVELS[1])),
    );

    assert.equal(turns.length, 5);
    assert.ok(turns.every((turn) => turn.play !== null));
  });
});
