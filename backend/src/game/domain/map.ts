import { GameError } from "./errors";
import { Entity } from "./entity";
import { Position } from "./position";

export const MAP_SIZE = 5;

const MASTER_COLUMN = 2;

type Grid = readonly (Entity | null)[][];

export class GameMap {
    private constructor(private readonly _grid: Grid) {}

    static initial(): GameMap {
        const grid: (Entity | null)[][] = Array.from({ length: MAP_SIZE }, () =>
            Array.from({ length: MAP_SIZE }, () => null as Entity | null)
        );

        for (let col = 0; col < MAP_SIZE; col++) {
            const entity = (owner: number) =>
                col === MASTER_COLUMN ? Entity.master(owner) : Entity.student(owner);
            grid[0][col] = entity(1);
            grid[MAP_SIZE - 1][col] = entity(0);
        }

        return new GameMap(grid);
    }

    static create(grid: Grid): GameMap {
        if (grid.length !== MAP_SIZE || grid.some((r) => r.length !== MAP_SIZE)) {
            throw new GameError("INVALID_MAP_SIZE", "The map must be a 5x5 grid");
        }
        return new GameMap(grid.map((row) => [...row]));
    }

    static templeArch(playerIndex: number): Position {
        return Position.create({
            row: playerIndex === 0 ? 0 : MAP_SIZE - 1,
            col: MASTER_COLUMN,
        });
    }

    isInside(pos: Position): boolean {
        return (
            pos.row >= 0 &&
            pos.row < MAP_SIZE &&
            pos.col >= 0 &&
            pos.col < MAP_SIZE
        );
    }

    entityAt(pos: Position): Entity | null {
        if (!this.isInside(pos)) {
            throw new GameError("POSITION_OUT_OF_BOUNDS", `Position out of bounds: ${pos.toString()}`);
        }
        return this._grid[pos.row][pos.col];
    }

    masterPosition(playerIndex: number): Position | null {
        for (let row = 0; row < MAP_SIZE; row++) {
            for (let col = 0; col < MAP_SIZE; col++) {
                const entity = this._grid[row][col];
                if (entity && entity.isMaster && entity.belongsTo(playerIndex)) {
                    return Position.create({ row, col });
                }
            }
        }
        return null;
    }

    entitiesOf(playerIndex: number): Position[] {
        const positions: Position[] = [];
        for (let row = 0; row < MAP_SIZE; row++) {
            for (let col = 0; col < MAP_SIZE; col++) {
                if (this._grid[row][col]?.belongsTo(playerIndex)) {
                    positions.push(Position.create({ row, col }));
                }
            }
        }
        return positions;
    }

    toMatrix(): number[][] {
        return this._grid.map((row) =>
            row.map((entity) => {
                if (!entity) return 0;
                const sign = entity.owner === 0 ? 1 : -1;
                return sign * (entity.isMaster ? 2 : 1);
            })
        );
    }
}
