export type GameErrorCode =
    | "INVALID_CARD_MOVES"
    | "INVALID_ENTITY_OWNER"
    | "INVALID_MAP_SIZE"
    | "POSITION_OUT_OF_BOUNDS"
    | "UNKNOWN_CARD"
    | "NULL_MOVE"
    | "EMPTY_SOURCE_SQUARE"
    | "INVALID_CARD_COUNT"
    | "INVALID_PLAYER_INDEX"
    | "CARD_NOT_IN_HAND"
    | "NOT_YOUR_ENTITY"
    | "ILLEGAL_MOVE"
    | "DESTINATION_OCCUPIED";

export class GameError extends Error {
    constructor(
        readonly code: GameErrorCode,
        message: string
    ) {
        super(message);
        this.name = "GameError";
    }
}
