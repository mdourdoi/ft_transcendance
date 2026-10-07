import { authFetch } from '$lib/auth';
import type { Game } from '../routes/History_Details.svelte';

type ApiMatch = {
	id: number;
	mode: 'RANKED' | 'UNRANKED' | 'BOT';
	endReason: string | null;
	ratingDelta: number | null;
	createdAt: string;
	finishedAt: string | null;
	won: boolean;
	opponent: { id: number; username: string; avatarUrl: string };
	replay: { moves: unknown[] } | null;
};

function duration(match: ApiMatch): string {
	if (!match.finishedAt) return '—';
	const minutes = Math.round((Date.parse(match.finishedAt) - Date.parse(match.createdAt)) / 60000);
	return minutes < 1 ? '< 1 min' : `${minutes} min`;
}

function toGame(match: ApiMatch): Game {
	return {
		id: String(match.id),
		result: match.won ? 'Victory' : 'Defeat',
		mode: match.mode === 'RANKED' ? 'Ranked' : match.mode === 'BOT' ? 'Training' : 'Normal',
		opponent: match.opponent.username,
		opponentId: String(match.opponent.id),
		avatar: `/api/avatars/${match.opponent.avatarUrl}`,
		duration: duration(match),
		date: match.finishedAt ?? match.createdAt,
		reason: match.endReason ?? undefined,
		ratingDelta: match.ratingDelta == null ? undefined : match.won ? match.ratingDelta : -match.ratingDelta,
		movesCount: match.replay?.moves.length,
	};
}

export class HistoryManager {
	games = $state<Game[]>([]);
	nextCursor = $state<number | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);

	reset() {
		this.games = [];
		this.nextCursor = null;
		this.loading = false;
		this.error = null;
	}

	async load() {
		this.reset();
		await this.fetchPage();
	}

	async loadMore() {
		if (this.loading || this.nextCursor === null) return;
		await this.fetchPage(this.nextCursor);
	}

	private async fetchPage(cursor?: number) {
		this.loading = true;
		this.error = null;
		try {
			const res = await authFetch(cursor === undefined ? '/api/matches' : `/api/matches?cursor=${cursor}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			this.games.push(...data.matches.map(toGame));
			this.nextCursor = data.nextCursor;
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
		} finally {
			this.loading = false;
		}
	}
}

export const historyManager = new HistoryManager();
