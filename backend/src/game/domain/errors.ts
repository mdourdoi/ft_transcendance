export type GameErrorCode =
    | "INVALID_CARD_MOVES"
    | "INVALID_ENTITY_OWNER"
    | "INVALID_MAP_SIZE"
    | "POSITION_OUT_OF_BOUNDS"
    | "UNKNOWN_CARD";

export class GameError extends Error {
    constructor(
        readonly code: GameErrorCode,
        message: string
    ) {
        super(message);
        this.name = "GameError";
    }
}
