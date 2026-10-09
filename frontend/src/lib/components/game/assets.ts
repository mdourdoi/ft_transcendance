export type Modal = 'rules' | 'resign' | 'exit' | 'result';

export const GAME_ASSETS = '../assets/game';

export const paint = (name: string) => `background-image: url('${GAME_ASSETS}/ui/${name}.svg')`;
