import { io, Socket } from 'socket.io-client';
import { get } from 'svelte/store';
import { authFetch, token } from '$lib/auth';

export type QueueMode = 'RANKED' | 'UNRANKED';
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
    try {
        const payload = get(token).split('.')[1];
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).sub ?? null;
    } catch {
        return null;
    }
}

function connect(namespace: string, handlers: OnlineGameHandlers): Socket {
    const socket = io(namespace, { auth: (cb) => cb({ token: get(token) }) });
    socket.on('exception', (error: { message?: string }) => {
        handlers.onError(error?.message ?? 'UNKNOWN_ERROR');
    });
    socket.on('auth.expired', () => handlers.onError('INVALID_TOKEN'));
    return socket;
}

export function playOnline(mode: QueueMode, handlers: OnlineGameHandlers): OnlineGame {
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

    async function start() {
        let current: { id: number } | null = null;
        try {
            const res = await authFetch('/api/matches/current');
            if (res.ok) current = (await res.json()).match;
        } catch {
            handlers.onError('NETWORK_ERROR');
        }
        if (closed) return;
        if (current) joinGame(current.id);
        else search();
    }

    void start();

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
