import { getAllCards } from './deck.js';
import { GameError } from './errors.js';
import { MAP_SIZE } from './map.js';
import { PositionProps } from './position.js';
import { TOTAL_CARDS } from './spread.js';

const CARD_NAMES = getAllCards().map((c) => c.name);
const SQUARE_BITS = 5;
const SQUARE_MASK = (1 << SQUARE_BITS) - 1;
const MOVE_BYTES = 2;

export interface ReplayMove {
  card: string;
  from: PositionProps | null;
  to: PositionProps | null;
}

export interface Replay {
  hands: [string[], string[]];
  neutral: string;
  moves: ReplayMove[];
}

function cardIndex(name: string): number {
  const index = CARD_NAMES.indexOf(name);
  if (index === -1) {
    throw new GameError('UNKNOWN_CARD', `Unknown card: ${name}`);
  }
  return index;
}

function cardName(index: number): string {
  const name = CARD_NAMES[index];
  if (name === undefined) {
    throw new GameError('UNKNOWN_CARD', `Unknown card index: ${index}`);
  }
  return name;
}

function square(position: PositionProps): number {
  return position.row * MAP_SIZE + position.col;
}

function position(value: number): PositionProps {
  return { row: Math.floor(value / MAP_SIZE), col: value % MAP_SIZE };
}

export function packMove(
  card: string,
  from?: PositionProps,
  to?: PositionProps,
): number {
  const squares = from && to ? (square(from) << SQUARE_BITS) | square(to) : 0;
  return (cardIndex(card) << (2 * SQUARE_BITS)) | squares;
}

export function unpackMove(packed: number): ReplayMove {
  const card = cardName(packed >> (2 * SQUARE_BITS));
  const from = (packed >> SQUARE_BITS) & SQUARE_MASK;
  const to = packed & SQUARE_MASK;
  if (from === to) {
    return { card, from: null, to: null };
  }
  return { card, from: position(from), to: position(to) };
}

export function encodeReplay(
  cards: readonly string[],
  moves: readonly number[],
): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(TOTAL_CARDS + moves.length * MOVE_BYTES);
  cards.forEach((name, i) => {
    bytes[i] = cardIndex(name);
  });
  moves.forEach((packed, i) => {
    const offset = TOTAL_CARDS + i * MOVE_BYTES;
    bytes[offset] = packed >> 8;
    bytes[offset + 1] = packed & 0xff;
  });
  return bytes;
}

export function decodeReplay(bytes: Uint8Array): Replay {
  const cards = Array.from(bytes.subarray(0, TOTAL_CARDS), cardName);
  const moves: ReplayMove[] = [];
  for (let i = TOTAL_CARDS; i + 1 < bytes.length; i += MOVE_BYTES) {
    moves.push(unpackMove((bytes[i] << 8) | bytes[i + 1]));
  }
  return {
    hands: [cards.slice(0, 2), cards.slice(2, 4)],
    neutral: cards[4],
    moves,
  };
}
