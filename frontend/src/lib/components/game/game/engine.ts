import { GameMap, Position, drawGameCards } from './index';
import type { Card } from './card';

export type Player = 0 | 1;
export interface Result { winner: Player; reason: 'capture' | 'temple' | 'abandon' | 'temps'; }
export interface GameState { map: GameMap; hands: [Card[], Card[]]; side: Card; turn: Player; history: string[]; result: Result | null; }
export function createGame(cards: Card[] = drawGameCards()): GameState {
 
if (cards.length !== 5 || new Set(cards.map(c=>c.name)).size !== 5) throw new Error('Il faut cinq cartes différentes.');
 	return { map: GameMap.initial(), hands: [cards.slice(0,2), cards.slice(2,4)], side: cards[4], turn: cards[4].color === 'BLUE' ? 0 : 1, history: [], result:null };
}

export function legalMoves(s: GameState, from: Position, cardIndex: number): Position[] {
	if(s.result || !s.map.isInside(from) || !s.map.entityAt(from)?.belongsTo(s.turn))
		return [];
 	const card=s.hands[s.turn][cardIndex]; if(!card) return [];
	return card.movesFor(s.turn).map(([r,c])=>from.translate(r,c)).filter(p=>s.map.isInside(p) && !s.map.entityAt(p)?.belongsTo(s.turn));
}

export function canMove(s: GameState): boolean {
	return s.map.entitiesOf(s.turn).some(p=>s.hands[s.turn].some((_,i)=>legalMoves(s,p,i).length>0));
}

function exchange(s:GameState, i:number): {hands:[Card[],Card[]]; side:Card} {
	const hands:[Card[],Card[]]=[[...s.hands[0]],[...s.hands[1]]]; const side=hands[s.turn][i];
	if(!side)
		throw new Error('Sélectionne une carte.');
	hands[s.turn][i]=s.side;
	return {hands,side};
}

export function playMove(s:GameState, from:Position, to:Position, i:number):GameState {
	if(!legalMoves(s,from,i).some(p=>p.equals(to)))
		throw new Error('Déplacement interdit.');
 	const piece=s.map.entityAt(from)!;
	const captured=s.map.entityAt(to);
	const grid=Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>s.map.entityAt(Position.create({row:r,col:c}))));
	grid[from.row][from.col]=null; grid[to.row][to.col]=piece;
 	const result:Result|null=captured?.isMaster ? {winner:s.turn,reason:'capture'} : piece.isMaster && to.equals(GameMap.templeArch(s.turn)) ? {winner:s.turn,reason:'temple'} : null;
	return {...s,...exchange(s,i),map:GameMap.create(grid),turn:(1-s.turn) as Player,result,history:[...s.history,`${s.turn===0?'Sud':'Nord'} · ${s.hands[s.turn][i].name} · ${'ABCDE'[from.col]}${5-from.row} → ${'ABCDE'[to.col]}${5-to.row}${captured?' · capture':''}`]};
}

export function passTurn(s:GameState,i:number):GameState {
	if(s.result || canMove(s))
		throw new Error('Il reste un déplacement possible.');
	return {...s,...exchange(s,i),turn:(1-s.turn) as Player,history:[...s.history,`${s.turn===0?'Sud':'Nord'} · passe et échange ${s.hands[s.turn][i]?.name}`]};
}