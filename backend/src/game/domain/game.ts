import { Card } from "./card";
import { GameError } from "./errors";
import { GameMap } from "./map";
import { Play } from "./play";
import { Spread } from "./spread";

export type Victory = "WAY_OF_STONE" | "WAY_OF_STREAM";

export interface GameStartOptions {
    firstPlayer?: number;
}

export class Game {
    private constructor(
        private readonly _map: GameMap,
        private readonly _spread: Spread,
        private readonly _currentPlayer: number,
        private readonly _turn: number,
        private readonly _winner: number | null,
        private readonly _victory: Victory | null
    ) {}

    static start(cards: readonly Card[], options: GameStartOptions = {}): Game {
        const spread = Spread.create(cards);
        const firstPlayer = options.firstPlayer ?? spread.startingPlayer();
        if (firstPlayer !== 0 && firstPlayer !== 1) {
            throw new GameError(
                "INVALID_PLAYER_INDEX",
                `Invalid first player: ${firstPlayer}`
            );
        }
        return new Game(GameMap.initial(), spread, firstPlayer, 1, null, null);
    }

    get map(): GameMap {
        return this._map;
    }

    get spread(): Spread {
        return this._spread;
    }

    get currentPlayer(): number {
        return this._currentPlayer;
    }

    get opponent(): number {
        return this._currentPlayer === 0 ? 1 : 0;
    }

    get turn(): number {
        return this._turn;
    }

    get winner(): number | null {
        return this._winner;
    }

    get victory(): Victory | null {
        return this._victory;
    }

    get isOver(): boolean {
        return this._winner !== null;
    }

    play(play: Play): Game {
        if (this.isOver) {
            throw new GameError("GAME_OVER", "The game is already over");
        }

        const entity = this._map.entityAt(play.from);
        if (!entity) {
            throw new GameError(
                "EMPTY_SOURCE_SQUARE",
                `No entity to move at ${play.from.toString()}`
            );
        }
        if (!entity.belongsTo(this._currentPlayer)) {
            throw new GameError(
                "NOT_YOUR_ENTITY",
                `Entity at ${play.from.toString()} is not owned by player ${this._currentPlayer}`
            );
        }

        const card = this._spread
            .handOf(this._currentPlayer)
            .find((c) => c.name === play.card);
        if (!card) {
            throw new GameError(
                "CARD_NOT_IN_HAND",
                `Player ${this._currentPlayer} does not hold card ${play.card}`
            );
        }

        if (!this._map.isInside(play.to)) {
            throw new GameError(
                "POSITION_OUT_OF_BOUNDS",
                `Position out of bounds: ${play.to.toString()}`
            );
        }

        const [rowDelta, colDelta] = play.delta;
        if (!card.allows(this._currentPlayer, rowDelta, colDelta)) {
            throw new GameError(
                "ILLEGAL_MOVE",
                `Card ${card.name} does not allow move ${play.toString()}`
            );
        }

        const target = this._map.entityAt(play.to);
        if (target && target.belongsTo(this._currentPlayer)) {
            throw new GameError(
                "DESTINATION_OCCUPIED",
                `Square ${play.to.toString()} is occupied by your own entity`
            );
        }

        const nextMap = this._map.move(play.from, play.to);
        const nextSpread = this._spread.exchange(this._currentPlayer, play.card);

        let victory: Victory | null = null;
        if (target && target.isMaster) {
            victory = "WAY_OF_STONE";
        } else if (
            entity.isMaster &&
            play.to.equals(GameMap.templeArch(this._currentPlayer))
        ) {
            victory = "WAY_OF_STREAM";
        }

        if (victory) {
            return new Game(
                nextMap,
                nextSpread,
                this._currentPlayer,
                this._turn + 1,
                this._currentPlayer,
                victory
            );
        }

        return new Game(
            nextMap,
            nextSpread,
            this.opponent,
            this._turn + 1,
            null,
            null
        );
    }

    pass(cardName: string): Game {
        if (this.isOver) {
            throw new GameError("GAME_OVER", "The game is already over");
        }
        if (this.hasLegalMove()) {
            throw new GameError(
                "MOVE_AVAILABLE",
                `Player ${this._currentPlayer} still has a legal move and cannot pass`
            );
        }

        const nextSpread = this._spread.exchange(this._currentPlayer, cardName);
        return new Game(
            this._map,
            nextSpread,
            this.opponent,
            this._turn + 1,
            null,
            null
        );
    }

    legalMoves(): Play[] {
        const moves: Play[] = [];
        const hand = this._spread.handOf(this._currentPlayer);

        for (const from of this._map.entitiesOf(this._currentPlayer)) {
            for (const card of hand) {
                for (const [rowDelta, colDelta] of card.movesFor(this._currentPlayer)) {
                    const to = from.translate(rowDelta, colDelta);
                    if (!this._map.isInside(to)) {
                        continue;
                    }
                    const occupant = this._map.entityAt(to);
                    if (occupant && occupant.belongsTo(this._currentPlayer)) {
                        continue;
                    }
                    moves.push(Play.create({ card: card.name, from, to }));
                }
            }
        }

        return moves;
    }

    hasLegalMove(): boolean {
        return this.legalMoves().length > 0;
    }
}
