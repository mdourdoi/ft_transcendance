import { io, Socket } from 'socket.io-client';
import { get, writable } from 'svelte/store';
import { authFetch, logout, token, tokenUserId } from '$lib/auth';

export type QueueMode = 'RANKED' | 'UNRANKED' | 'BOT';
export const BOT_ID = 0;
export const BOT_LEVELS = [
    { level: 1, name: 'Deshi', elo: 600, image: '/assets/game/pieces/black-student.webp' },
    { level: 2, name: 'Senpai', elo: 1100, image: '/assets/game/pieces/red-student.webp' },
    { level: 3, name: 'Sensei', elo: 1450, image: '/assets/game/pieces/black-master.webp' },
    { level: 4, name: 'Shihan', elo: 2000, image: '/assets/game/pieces/red-master.webp' }
];
export const botLevel = writable(Number(localStorage.getItem('botLevel')) || BOT_LEVELS[0].level);
botLevel.subscribe((level) => localStorage.setItem('botLevel', String(level)));

export const MODE_SLUGS: Record<QueueMode, string> = { RANKED: 'ranked', UNRANKED: 'normal', BOT: 'training' };

export function modeOfSlug(slug?: string): QueueMode | null {
    return (Object.keys(MODE_SLUGS) as QueueMode[]).find((mode) => MODE_SLUGS[mode] === slug) ?? null;
}

export function botOfLevel(level: number | null | undefined) {
    return BOT_LEVELS.find((bot) => bot.level === level) ?? BOT_LEVELS[0];
}

export type GameStatus = 'WAITING' | 'PLAYING' | 'OVER';
export type GameEndReason =
    | 'WAY_OF_STONE'
    | 'WAY_OF_STREAM'
    | 'RESIGNATION'
    | 'DISCONNECTION'
    | 'TIMEOUT'
    | 'CANCELLED';

export interface CardView {
    name: string;
    color: string;
    moves: number[][];
}

export interface Square {
    row: number;
    col: number;
}

export interface PlayView {
    card: string;
    from: Square;
    to: Square;
}

export interface GameStateView {
    matchId: number;
    mode: QueueMode;
    botLevel: number | null;
    status: GameStatus;
    playerIds: [number, number];
    board: number[][];
    hands: [CardView[], CardView[]];
    neutral: CardView;
    currentPlayer: number;
    turn: number;
    clocks: [number, number];
    turnStartedAt: number | null;
    legalMoves: PlayView[];
    winnerId: number | null;
    endReason: GameEndReason | null;
}

export interface CurrentGame {
    matchId: number;
    mode: QueueMode;
    status: 'WAITING' | 'PLAYING';
    botLevel: number | null;
    forfeitAt: number | null;
}

export async function fetchCurrentGame(): Promise<CurrentGame | null> {
    const res = await authFetch('/api/games/current');
    if (!res.ok) throw new Error('NETWORK_ERROR');
    return (await res.json()).game;
}

export interface OnlineGameHandlers {
    onState: (state: GameStateView) => void;
    onPresence: (userId: number, connected: boolean) => void;
    onError: (code: string) => void;
}

export interface OnlineGame {
    move: (card: string, from: Square, to: Square) => void;
    pass: (card: string) => void;
    resign: () => void;
    close: () => void;
}

export function currentUserId(): number | null {
    return tokenUserId();
}

function connect(namespace: string, handlers: OnlineGameHandlers): Socket {
    const socket = io(namespace, { auth: (cb) => cb({ token: get(token) }) });
    socket.on('exception', (error: { message?: string }) => {
        handlers.onError(error?.message ?? 'UNKNOWN_ERROR');
    });
    socket.on('auth.expired', () => logout());
    return socket;
}

export function playOnline(mode: QueueMode, handlers: OnlineGameHandlers, ongoing: number | null = null): OnlineGame {
    let queue: Socket | null = null;
    let game: Socket | null = null;
    let matchId: number | null = null;
    let closed = false;

    function joinGame(id: number) {
        if (closed || game) return;
        matchId = id;
        queue?.disconnect();
        queue = null;
        game = connect('/game', handlers);
        game.on('connect', () => game?.emit('game.join', { matchId }));
        game.on('game.state', (state: GameStateView) => handlers.onState(state));
        game.on('game.playerJoined', ({ userId }: { userId: number }) => {
            handlers.onPresence(userId, true);
        });
        game.on('game.playerDisconnected', ({ userId }: { userId: number }) => {
            handlers.onPresence(userId, false);
        });
    }

    function search() {
        queue = connect('/queue', handlers);
        queue.on('connect', () => queue?.emit('queue.join', { mode }));
        queue.on('queue.matched', (match: { matchId: number }) => joinGame(match.matchId));
    }

    async function challengeBot() {
        try {
            const res = await authFetch('/api/bots/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level: get(botLevel) })
            });
            const body = await res.json();
            if (res.ok) joinGame(body.matchId);
            else handlers.onError(body.message ?? 'UNKNOWN_ERROR');
        } catch {
            handlers.onError('NETWORK_ERROR');
        }
    }

    if (ongoing !== null) joinGame(ongoing);
    else if (mode === 'BOT') void challengeBot();
    else search();

    return {
        move: (card, from, to) => game?.emit('game.move', { matchId, card, from, to }),
        pass: (card) => game?.emit('game.pass', { matchId, card }),
        resign: () => game?.emit('game.resign', { matchId }),
        close: () => {
            closed = true;
            queue?.disconnect();
            game?.disconnect();
            queue = null;
            game = null;
        },
    };
}
