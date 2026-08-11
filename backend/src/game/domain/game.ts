import { Card } from "./card";
import { Player } from "./player";

export interface GameProps {
    players: Player[];
    cards: Card[];
    maps: number[][];
    turns?: number;
}

export class Game {
    private constructor(
        private readonly _players: readonly Player[],
        private readonly _cards: readonly Card[],
        private readonly _maps: readonly number[][],
        private readonly _turns: number
    ) {}

    static create(props: GameProps): Game {
        return new Game(
            props.players,
            props.cards,
            props.maps,
            props.turns ?? 0
        );
    }

    get players(): readonly Player[] {
        return this._players;
    }

    get cards(): readonly Card[] {
        return this._cards;
    }

    get maps(): readonly number[][] {
        return this._maps;
    }

    get turns(): number {
        return this._turns;
    }
}
