import type { CardView, GameEndReason, GameStateView } from "$lib/game-socket";
import { Card } from "./card";
import type { CardColor } from "./card";
import type { GameState, Player, Result } from "./engine";
import { Entity } from "./entity";
import { GameMap } from "./map";

const END_REASONS: Record<GameEndReason, Result["reason"]> = {
    WAY_OF_STONE: "capture",
    WAY_OF_STREAM: "temple",
    RESIGNATION: "abandon",
    TIMEOUT: "temps",
    DISCONNECTION: "deconnexion",
    CANCELLED: "annulation",
};

function toCard(view: CardView): Card {
    return Card.create({ name: view.name, moves: view.moves, color: view.color as CardColor });
}

function toEntity(value: number): Entity | null {
    if (value === 0) return null;
    const owner = value > 0 ? 0 : 1;
    return Math.abs(value) === 2 ? Entity.master(owner) : Entity.student(owner);
}

function toResult(view: GameStateView): Result | null {
    if (view.status !== "OVER") return null;
    return {
        winner: view.winnerId === null ? null : (view.playerIds.indexOf(view.winnerId) as Player),
        reason: END_REASONS[view.endReason ?? "CANCELLED"],
    };
}

export function toGameState(view: GameStateView): GameState {
    return {
        map: GameMap.create(view.board.map((row) => row.map(toEntity))),
        hands: [view.hands[0].map(toCard), view.hands[1].map(toCard)],
        side: toCard(view.neutral),
        turn: view.currentPlayer as Player,
        history: [],
        result: toResult(view),
    };
}

export function liveClocks(view: GameStateView, now = Date.now()): number[] {
    const clocks = [...view.clocks];
    if (view.status === "PLAYING" && view.turnStartedAt !== null) {
        const elapsed = Math.max(0, now - view.turnStartedAt);
        clocks[view.currentPlayer] = Math.max(0, clocks[view.currentPlayer] - elapsed);
    }
    return clocks;
}
