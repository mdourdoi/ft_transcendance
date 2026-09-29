import { Card, CardProps } from "./card";
import { GameError } from "./errors";

const BASE_CARDS: readonly CardProps[] = [
    { name: "Tiger", color: "BLUE", moves: [[-2, 0], [1, 0]] },
    { name: "Dragon", color: "RED", moves: [[-1, -2], [-1, 2], [1, -1], [1, 1]] },
    { name: "Frog", color: "RED", moves: [[-1, -1], [0, -2], [1, 1]] },
    { name: "Rabbit", color: "BLUE", moves: [[-1, 1], [0, 2], [1, -1]] },
    { name: "Crab", color: "BLUE", moves: [[-1, 0], [0, -2], [0, 2]] },
    { name: "Elephant", color: "RED", moves: [[-1, -1], [-1, 1], [0, -1], [0, 1]] },
    { name: "Goose", color: "BLUE", moves: [[-1, -1], [0, -1], [0, 1], [1, 1]] },
    { name: "Rooster", color: "RED", moves: [[-1, 1], [0, 1], [0, -1], [1, -1]] },
    { name: "Monkey", color: "BLUE", moves: [[-1, -1], [-1, 1], [1, -1], [1, 1]] },
    { name: "Mantis", color: "RED", moves: [[-1, -1], [-1, 1], [1, 0]] },
    { name: "Horse", color: "RED", moves: [[-1, 0], [0, -1], [1, 0]] },
    { name: "Ox", color: "BLUE", moves: [[-1, 0], [0, 1], [1, 0]] },
    { name: "Crane", color: "BLUE", moves: [[-1, 0], [1, -1], [1, 1]] },
    { name: "Boar", color: "RED", moves: [[-1, 0], [0, -1], [0, 1]] },
    { name: "Eel", color: "BLUE", moves: [[-1, -1], [1, -1], [0, 1]] },
    { name: "Cobra", color: "RED", moves: [[-1, 1], [1, 1], [0, -1]] },
];

export function card(name: string): Card {
    const props = BASE_CARDS.find((c) => c.name === name);
    if (!props) {
        throw new GameError("UNKNOWN_CARD", `Unknown card: ${name}`);
    }
    return Card.create({ ...props, moves: props.moves.map((m) => [...m]) });
}

export function fullDeck(): Card[] {
    return BASE_CARDS.map((props) =>
        Card.create({ ...props, moves: props.moves.map((m) => [...m]) })
    );
}

export function drawGameCards(rng: () => number = Math.random): Card[] {
    const pool = fullDeck();
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 5);
}

export function getAllCards(): CardProps[] {
    return [...BASE_CARDS];
}
