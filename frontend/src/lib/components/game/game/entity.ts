import { GameError } from "./errors";

export type EntityKind = "MASTER" | "STUDENT";

export interface EntityProps {
    kind: EntityKind;
    owner: number;
}

export class Entity {
    private constructor(
        private readonly _kind: EntityKind,
        private readonly _owner: number
    ) {}

    static create(props: EntityProps): Entity {
        if (props.owner !== 0 && props.owner !== 1) {
            throw new GameError("INVALID_ENTITY_OWNER", `Invalid entity owner: ${props.owner}`);
        }
        return new Entity(props.kind, props.owner);
    }

    static master(owner: number): Entity {
        return Entity.create({ kind: "MASTER", owner });
    }

    static student(owner: number): Entity {
        return Entity.create({ kind: "STUDENT", owner });
    }

    get kind(): EntityKind {
        return this._kind;
    }

    get owner(): number {
        return this._owner;
    }

    get isMaster(): boolean {
        return this._kind === "MASTER";
    }

    belongsTo(playerIndex: number): boolean {
        return this._owner === playerIndex;
    }
}
