import { GameError } from "./errors";

export type CardColor = "RED" | "BLUE";

export type Move = readonly [number, number];

export interface CardProps {
    name: string;
    moves: number[][];
    color?: CardColor;
}

export class Card {
    private constructor(
        private readonly _name: string,
        private readonly _moves: readonly Move[],
        private readonly _color: CardColor
    ) {}

    static create(props: CardProps): Card {
        if (props.moves.length === 0) {
            throw new GameError("INVALID_CARD_MOVES", `Card ${props.name} has no moves`);
        }
        const moves = props.moves.map(([row, col]): Move => [row, col]);
        return new Card(props.name, moves, props.color ?? "RED");
    }

    get name(): string {
        return this._name;
    }

    get moves(): readonly Move[] {
        return this._moves;
    }

    get color(): CardColor {
        return this._color;
    }

    mirroredMoves(): readonly Move[] {
        return this._moves.map(([row, col]): Move => [-row, -col]);
    }

    movesFor(playerIndex: number): readonly Move[] {
        return playerIndex === 0 ? this._moves : this.mirroredMoves();
    }

    allows(playerIndex: number, rowDelta: number, colDelta: number): boolean {
        return this.movesFor(playerIndex).some(
            ([row, col]) => row === rowDelta && col === colDelta
        );
    }
}
