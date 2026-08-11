export interface CardProps {
    name: string;
    moves: number[][];
}

export class Card {
    private constructor(
        private readonly _name: string,
        private readonly _moves: readonly number[][]
    ) {}

    static create(props: CardProps): Card {
        return new Card(props.name, props.moves);
    }

    get name(): string {
        return this._name;
    }

    get moves(): readonly number[][] {
        return this._moves;
    }
}
