import { GameError } from "./errors";
import { Position } from "./position";

export interface PlayProps {
    card: string;
    from: Position;
    to: Position;
}

export class Play {
    private constructor(
        private readonly _card: string,
        private readonly _from: Position,
        private readonly _to: Position
    ) {}

    static create(props: PlayProps): Play {
        if (props.from.equals(props.to)) {
            throw new GameError(
                "NULL_MOVE",
                "A play must move an entity to a different square"
            );
        }
        return new Play(props.card, props.from, props.to);
    }

    get card(): string {
        return this._card;
    }

    get from(): Position {
        return this._from;
    }

    get to(): Position {
        return this._to;
    }

    get delta(): [number, number] {
        return this._from.deltaTo(this._to);
    }

    toString(): string {
        return `${this._card}: ${this._from.toString()} -> ${this._to.toString()}`;
    }
}
