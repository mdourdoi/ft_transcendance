export interface PositionProps {
    row: number;
    col: number;
}

export class Position {
    private constructor(
        private readonly _row: number,
        private readonly _col: number
    ) {}

    static create(props: PositionProps): Position {
        return new Position(props.row, props.col);
    }

    get row(): number {
        return this._row;
    }

    get col(): number {
        return this._col;
    }

    equals(other: Position): boolean {
        return this._row === other._row && this._col === other._col;
    }

    translate(rowDelta: number, colDelta: number): Position {
        return new Position(this._row + rowDelta, this._col + colDelta);
    }

    deltaTo(other: Position): [number, number] {
        return [other._row - this._row, other._col - this._col];
    }

    toString(): string {
        return `(${this._row}, ${this._col})`;
    }
}
