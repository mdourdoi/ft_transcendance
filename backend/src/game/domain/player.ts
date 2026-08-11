import { Card } from "./card";

export interface PlayerProps {
    cards: Card[];
}

export class Player {
    private constructor(private readonly _cards: readonly Card[]) {}

    static create(props: PlayerProps): Player {
        return new Player(props.cards);
    }

    get cards(): readonly Card[] {
        return this._cards;
    }
}
