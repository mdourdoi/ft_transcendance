import { BotLevel } from './calculator/choose-play.js';

export const BOT_USERNAME = 'Dojo';
export const BOT_PLAYER_ID = 0;
export const BOT_PLAYER_INDEX = 1;
export const BOT_LEVELS: BotLevel[] = [
  { depth: 1, temperature: 120 },
  { depth: 3, temperature: 40 },
  { depth: 5, temperature: 15 },
  { depth: 8, temperature: 0 },
];
export const DEFAULT_BOT_LEVEL = BOT_LEVELS.length;
