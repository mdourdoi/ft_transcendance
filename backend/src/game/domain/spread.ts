import { Card } from "./card";
import { GameError } from "./errors";

export const TOTAL_CARDS = 5;

export class Spread {
    private constructor(
        private readonly _hands: readonly (readonly Card[])[],
        private readonly _neutral: Card
    ) {}

    static create(cards: readonly Card[]): Spread {
        if (cards.length !== TOTAL_CARDS) {
            throw new GameError(
                "INVALID_CARD_COUNT",
                `A spread needs exactly ${TOTAL_CARDS} cards, got ${cards.length}`
            );
        }
        const hands = [
            [cards[0], cards[1]],
            [cards[2], cards[3]],
        ];
        return new Spread(hands, cards[4]);
    }

    private assertPlayer(playerIndex: number): void {
        if (playerIndex !== 0 && playerIndex !== 1) {
            throw new GameError(
                "INVALID_PLAYER_INDEX",
                `Invalid player index: ${playerIndex}`
            );
        }
    }

    get neutral(): Card {
        return this._neutral;
    }

    handOf(playerIndex: number): readonly Card[] {
        this.assertPlayer(playerIndex);
        return this._hands[playerIndex];
    }

    startingPlayer(): number {
        return this._neutral.color === "RED" ? 0 : 1;
    }

    has(playerIndex: number, cardName: string): boolean {
        this.assertPlayer(playerIndex);
        return this._hands[playerIndex].some((c) => c.name === cardName);
    }

    exchange(playerIndex: number, cardName: string): Spread {
        this.assertPlayer(playerIndex);
        const played = this._hands[playerIndex].find((c) => c.name === cardName);
        if (!played) {
            throw new GameError(
                "CARD_NOT_IN_HAND",
                `Player ${playerIndex} does not hold card ${cardName}`
            );
        }

        const newHand = this._hands[playerIndex].map((c) =>
            c.name === cardName ? this._neutral : c
        );
        const hands = this._hands.map((hand, idx) =>
            idx === playerIndex ? newHand : hand
        );
        return new Spread(hands, played);
    }
}
