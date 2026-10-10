import { authFetch } from '$lib/auth';

export class StatManager {
    error = $state('');
    matches = $state<any[]>([]);

    wins = $derived(this.matches.filter(m => m.won === true).length);
    ranked = $derived(this.matches.filter(m => m.mode === 'RANKED').length);
    normal = $derived(this.matches.filter(m => m.mode === 'UNRANKED').length);
    defis = $derived(this.matches.filter(m => m.mode === 'BOT').length);

    cardCounts = $derived.by(() => {
        const counts: Record<string, number> = {};
        for (const m of this.matches) {
            const { hands, neutral, moves } = m.replay;
            const h: string[][] = hands.map((x: string[]) => [...x]);
            let neu: string = neutral;

            for (const mv of moves) {
                const p = h[0].includes(mv.card) ? 0 : 1;
                const idx = h[p].indexOf(mv.card);
                if (idx === -1) continue;
                if (p === m.playerIndex) {
                    const key = mv.card.toUpperCase();
                    counts[key] = (counts[key] ?? 0) + 1;
                }
                h[p][h[p].indexOf(mv.card)] = neu;
                neu = mv.card;
            }
        }
        return counts;
    });

    mostPlayedCards = $derived(
        Object.entries(this.cardCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([card, games], i) => ({
                rank: i + 1,
                card,
                games,
                image: "../assets/home/avatar/dragon.png",
            }))
    );

    frequentOpponents = $derived.by(() => {
        const map = new Map<number, { name: string; image: string; games: number }>();
        for (const m of this.matches) {
            const o = m.opponent;
            const e = map.get(o.id) ?? {
                name: o.username,
                image: `/api/avatars/${o.avatarUrl || "default.png"}`,
                games: 0,
            };
            e.games++;
            map.set(o.id, e);
        }
        return [...map.values()]
            .sort((a, b) => b.games - a.games)
            .slice(0, 5)
            .map((o, i) => ({ rank: i + 1, ...o }));
    });

    async getstat() {
        try {
            const res = await authFetch('/api/matches');
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            this.matches = data.matches;
        } catch (err) {
            console.error('getstat error:', err);
            this.error = err instanceof Error ? err.message : String(err);
        }
    }
}

export const statManager = new StatManager();