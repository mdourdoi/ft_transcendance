import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'node:worker_threads';
import { GameSnapshot } from '../game/domain/index.js';
import { BOT_WORKERS } from './bots.constants.js';
import { BotAnswer } from './calculator/bot-worker.js';
import { BotLevel } from './calculator/choose-play.js';

type BotTurn = Required<Pick<BotAnswer, 'card' | 'play'>>;

interface Pending {
  resolve: (turn: BotTurn) => void;
  reject: (error: Error) => void;
}

interface Slot {
  worker: Worker;
  pending: Map<number, Pending>;
}

@Injectable()
export class BotPool implements OnModuleDestroy {
  private readonly logger = new Logger(BotPool.name);
  private readonly slots: Slot[] = [];
  private nextId = 0;

  choose(snapshot: GameSnapshot, level: BotLevel): Promise<BotTurn> {
    const slot = this.idlest();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      slot.pending.set(id, { resolve, reject });
      slot.worker.postMessage({ id, snapshot, level });
    });
  }

  async onModuleDestroy() {
    const slots = this.slots.splice(0);
    await Promise.all(slots.map((slot) => slot.worker.terminate()));
  }

  private idlest(): Slot {
    if (this.slots.length < BOT_WORKERS) {
      return this.spawn();
    }
    return this.slots.reduce((a, b) =>
      b.pending.size < a.pending.size ? b : a,
    );
  }

  private spawn(): Slot {
    const worker = new Worker(
      new URL('./calculator/bot-worker.js', import.meta.url),
    );
    const slot: Slot = { worker, pending: new Map() };
    worker.on('message', ({ id, error, card, play }: BotAnswer) => {
      const pending = slot.pending.get(id);
      slot.pending.delete(id);
      if (error !== undefined || card === undefined) {
        pending?.reject(new Error(error ?? 'bot answered without a card'));
      } else {
        pending?.resolve({ card, play: play ?? null });
      }
    });
    worker.on('error', (error) => {
      this.logger.error(`bot worker crashed: ${error.message}`);
    });
    worker.on('exit', (code) => {
      const index = this.slots.indexOf(slot);
      if (index !== -1) {
        this.slots.splice(index, 1);
      }
      const error = new Error(`bot worker exited with code ${code}`);
      for (const pending of slot.pending.values()) {
        pending.reject(error);
      }
      slot.pending.clear();
    });
    this.slots.push(slot);
    return slot;
  }
}
