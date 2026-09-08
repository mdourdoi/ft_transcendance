import { Card } from "./card";
import { GameError } from "./errors";
import { GameMap } from "./map";
import { Spread } from "./spread";

export interface GameStartOptions {
    firstPlayer?: number;
}

export class Game {
    private constructor(
        private readonly _map: GameMap,
        private readonly _spread: Spread,
        private readonly _currentPlayer: number,
        private readonly _turn: number
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
        return new Game(GameMap.initial(), spread, firstPlayer, 1);
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
}
