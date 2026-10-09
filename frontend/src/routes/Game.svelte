<script lang="ts">
    import { onMount } from 'svelte';
    import { BoardPanel, ExchangePanel, GameDialog, GameMenu, GAME_ASSETS, InfoPanel, PlayerPanel, paint, type Modal } from '$lib/components/game';
    import '$lib/components/game/game.css';
    import { card } from '$lib/game/index';
    import type { Position } from '$lib/game/index';
    import { createGame, legalMoves, canMove, playMove, passTurn } from '$lib/game/engine';
    import type { GameState, Player } from '$lib/game/engine';
    import { liveClocks, toGameState } from '$lib/game/online';
    import { BOT_ID, BOT_LEVELS, botLevel, currentUserId, playOnline } from '$lib/game-socket';
    import type { GameStateView, OnlineGame } from '$lib/game-socket';
    import { authFetch } from '$lib/auth';
    import { navigate } from '$lib/router';
    import { t } from '$lib/i18n';
    import { friendManager } from '$lib/stores/friend.svelte';

    let { mode }: { mode?: string } = $props();

    const names: [string, string] = ['RaiNeko', 'Kenshii'];

    const players = [1, 0] as const;
    const myId = currentUserId();

    let game = $state(createGame(['Tiger', 'Dragon', 'Crane', 'Cobra', 'Mantis'].map(card)));
    let past = $state.raw<GameState[]>([]);
    let cursor = $state<number | null>(null);
    let selected = $state<Position | null>(null);
    let cardIndex = $state(0);
    let clocks = $state([600000, 600000]);
    let started = $state(false);
    let error = $state('');
    let modal = $state<Modal | null>(null);
    let view = $state<GameStateView | null>(null);
    let opponentAway = $state(false);
    let profiles = $state<Record<number, { username: string; avatarUrl: string }>>({});
    let session: OnlineGame | null = null;
    const requested: Record<number, boolean> = {};
    let lastTick = 0;

    const queueMode = $derived(mode === 'ranked' ? 'RANKED' : mode === 'normal' ? 'UNRANKED' : mode === 'training' ? 'BOT' : null);
    const online = $derived(queueMode !== null);
    const me = $derived(view && myId !== null ? view.playerIds.indexOf(myId) : -1);
    const flipped = $derived(online && me === 1);
    const waiting = $derived(online && view?.status !== 'PLAYING' && view?.status !== 'OVER');
    const myTurn = $derived(!online || game.turn === me);
    const over = $derived(!!game.result);
    const reviewing = $derived(cursor !== null);
    const locked = $derived(over || waiting || reviewing);
    const shown = $derived(cursor === null ? game : past[cursor]);
    const step = $derived(cursor ?? past.length);
    const seats = $derived(online && view ? (view.playerIds.map(nameOf) as [string, string]) : names);
    const destinations = $derived(selected && !reviewing ? legalMoves(game, selected, cardIndex) : []);
    const blocked = $derived(!over && !canMove(game));
    const liveMode = $derived(view?.mode ?? queueMode);
    const title = $derived($t(!online ? 'GAME.TITLES.LOCAL' : liveMode === 'RANKED' ? 'GAME.TITLES.RANKED' : liveMode === 'BOT' ? 'GAME.TITLES.TRAINING' : 'GAME.TITLES.NORMAL'));
    const winner = $derived(game.result?.winner ?? null);
    const outcome = $derived(winner === null ? $t('GAME.OUTCOME.CANCELLED') : $t('GAME.OUTCOME.WINNER', { values: { name: seats[winner] } }));
    const verdict = $derived($t(!online || me < 0 || winner === null ? 'GAME.VERDICT.OVER' : winner === me ? 'GAME.VERDICT.WIN' : 'GAME.VERDICT.LOSS'));
    const status = $derived.by(() => {
        if (over)
            return $t('GAME.VERDICT.OVER');
        if (waiting)
            return $t(view ? 'GAME.STATUS.WAITING_OPPONENT' : 'GAME.STATUS.SEARCHING');
        if (reviewing)
            return $t('GAME.STATUS.REVIEW', { values: { step, total: past.length } });
        return $t('GAME.STATUS.TURN', { values: { name: seats[game.turn] } });
    });
    const titles = $derived<Record<Modal, string>>({
        rules: $t('GAME.MODALS.RULES'),
        resign: $t('GAME.MODALS.RESIGN'),
        exit: $t('GAME.MODALS.EXIT'),
        result: verdict
    });

    const active = (owner: number) => game.turn === owner && !over && !waiting;
    const playable = (owner: number) => active(owner) && !reviewing && myTurn;
    const other = (player: Player) => (1 - player) as Player;

    function nameOf(id: number) {
        if (profiles[id])
            return profiles[id].username;
        if (id === myId)
            return friendManager.username || $t('GAME.ME');
        if (id === BOT_ID)
            return (BOT_LEVELS.find((bot) => bot.level === $botLevel) ?? BOT_LEVELS[0]).name;
        return friendManager.friends.find((f) => f.user?.id === id)?.user.username ?? $t('GAME.OPPONENT');
    }
    function avatarOf(owner: number) {
        const id = online && view ? view.playerIds[owner] : null;
        if (id === BOT_ID)
            return (BOT_LEVELS.find((bot) => bot.level === $botLevel) ?? BOT_LEVELS[0]).image;
        if (id !== null && profiles[id])
            return `/api/avatars/${profiles[id].avatarUrl}`;
        return `${GAME_ASSETS}/avatars/${owner === 1 ? 'ronin' : 'kunoichi'}.webp`;
    }
    async function loadProfile(id: number) {
        try {
            const res = await authFetch(`/api/users/${id}/profile`);
            if (res.ok)
                profiles[id] = await res.json();
            else
                requested[id] = false;
        } catch {
            requested[id] = false;
        }
    }
    function time(ms: number) {
        const seconds = Math.ceil(ms / 1000);
        const pad = (value: number) => String(value).padStart(2, '0');
        return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
    }
    function tick() {
        const now = performance.now();
        if (view)
            clocks = liveClocks(view);
        else if (!online && started && !over) {
            const next = [...clocks];
            next[game.turn] = Math.max(0, next[game.turn] - (now - lastTick));
            clocks = next;
            if (next[game.turn] === 0)
                game = { ...game, result: { winner: other(game.turn), reason: 'temps' } };
        }
        lastTick = now;
    }
    function reset() {
        game = createGame();
        past = [];
        cursor = null;
        selected = null;
        cardIndex = 0;
        error = '';
        modal = null;
    }
    function sync(next: GameStateView) {
        if (view?.matchId === next.matchId && view.neutral.name !== next.neutral.name)
            past = [...past, game];
        view = next;
        game = toGameState(next);
        for (const id of next.playerIds) {
            if (id === BOT_ID || requested[id])
                continue;
            requested[id] = true;
            void loadProfile(id);
        }
        selected = null;
        cardIndex = 0;
        error = '';
        if (next.status === 'OVER')
            opponentAway = false;
    }
    function startOnline() {
        if (!queueMode)
            return;
        session?.close();
        reset();
        view = null;
        opponentAway = false;
        session = playOnline(queueMode, {
            onState: sync,
            onPresence: (userId, connected) => {
                if (userId !== myId)
                    opponentAway = !connected;
            },
            onError: (code) => (error = code)
        });
    }
    function commit(play: () => GameState) {
        try {
            const before = game;
            game = play();
            past = [...past, before];
            selected = null;
            cardIndex = 0;
            started = true;
            lastTick = performance.now();
        } catch (e) {
            error = (e as Error).message;
        }
    }
    function choose(pos: Position) {
        tick();
        if (locked || !myTurn)
            return;
        error = '';
        if (game.map.entityAt(pos)?.belongsTo(game.turn)) {
            selected = selected?.equals(pos) ? null : pos;
            return;
        }
        if (!selected)
            return;
        const from = selected;
        if (!online)
            commit(() => playMove(game, from, pos, cardIndex));
        else if (legalMoves(game, from, cardIndex).some((p) => p.equals(pos)))
            session?.move(game.hands[game.turn][cardIndex].name, { row: from.row, col: from.col }, { row: pos.row, col: pos.col });
        else
            error = 'FORBIDDEN_MOVE';
    }
    function pass() {
        tick();
        if (locked || !myTurn)
            return;
        if (online)
            session?.pass(game.hands[game.turn][cardIndex].name);
        else
            commit(() => passTurn(game, cardIndex));
    }
    function resign() {
        tick();
        modal = null;
        if (online)
            session?.resign();
        else if (!over)
            game = { ...game, result: { winner: other(game.turn), reason: 'abandon' } };
    }
    function restart() {
        if (online)
            return startOnline();
        reset();
        clocks = [600000, 600000];
        started = false;
        lastTick = performance.now();
    }
    function quit() {
        modal = null;
        navigate('/home');
    }
    function back() {
        if (step > 0)
            cursor = step - 1;
    }
    function forward() {
        if (cursor !== null)
            cursor = cursor + 1 < past.length ? cursor + 1 : null;
    }
    function keys(event: KeyboardEvent) {
        if (modal)
            return;
        if (event.key === 'ArrowLeft')
            back();
        else if (event.key === 'ArrowRight')
            forward();
    }

    onMount(() => {
        lastTick = performance.now();
        const id = setInterval(tick, 100);
        startOnline();
        return () => {
            clearInterval(id);
            session?.close();
        };
    });
    $effect(() => {
        if (over)
            modal = 'result';
    });
</script>

<svelte:window onkeydown={keys} />

<svelte:head>
    <title>{$t('GAME.HEAD_TITLE')}</title>
    <meta name="description" content={$t('GAME.HEAD_DESCRIPTION')}/>
</svelte:head>

<main style="background-image: url('../assets/game/background/dojo.webp')" class="min-h-dvh w-full bg-cover bg-center bg-repeat font-brush text-[#241a12] lg:flex lg:items-center">
    <div class="@container relative isolate mx-auto flex w-full max-w-xl flex-col gap-3 p-3 lg:block lg:aspect-[3/2] lg:w-[min(100%,150dvh)] lg:max-w-[1800px] lg:p-0">
        <img src="../assets/game/decor/sakura.webp" alt="" aria-hidden="true" draggable="false" class="pointer-events-none absolute -left-[2%] top-0 -z-10 hidden w-[27%] lg:block" />
        <img src="../assets/game/decor/pagoda.webp" alt="" aria-hidden="true" draggable="false" class="pointer-events-none absolute right-[2%] top-[8%] -z-10 hidden w-[15%] opacity-80 lg:block" />
        <img src="../assets/game/decor/ronin.webp" alt="" aria-hidden="true" draggable="false" class="pointer-events-none absolute bottom-[9%] left-[2%] -z-10 hidden h-[28%] w-[13%] object-contain lg:block" />
        <img src="../assets/game/ui/onitama.webp" alt="Onitama" class="absolute left-[1%] top-[1%] hidden h-[15%] w-[21%] object-contain lg:block" />
        <header class="order-1 mx-auto w-full max-w-sm text-center lg:absolute lg:left-[39%] lg:top-[3%] lg:w-[26%] lg:max-w-none">
            <h1 class="ink-banner py-[5%] text-[clamp(18px,1.65cqw,29px)]" style={paint('brush-black')}>{title}</h1>
            <p class="mt-1 text-[clamp(12px,1cqw,17px)]">{$t('GAME.TAGLINE')}</p>
        </header>
        <GameMenu {step} total={past.length} {reviewing} onexit={() => (modal = 'exit')} onrules={() => (modal = 'rules')} onback={back} onforward={forward} onlive={() => (cursor = null)} />
        {#each players as owner (owner)}
            <PlayerPanel
                {owner}
                name={seats[owner]}
                avatar={avatarOf(owner)}
                clock={time(clocks[owner])}
                cards={online && !view ? [] : shown.hands[owner]}
                {flipped}
                active={active(owner)}
                playable={playable(owner)}
                opponent={online && owner !== me}
                {cardIndex}
                onselect={(index) => {
                    cardIndex = index;
                    error = '';
                }}
            />
        {/each}
        <BoardPanel map={shown.map} {flipped} selected={reviewing ? null : selected} {destinations} disabled={locked || !myTurn} {waiting} {status} cancellable={!view} oncell={choose} oncancel={quit} />
        <ExchangePanel card={!online || view ? shown.side : null} player={flipped ? 1 - shown.turn : shown.turn} />
        <InfoPanel
            {status}
            {over}
            selecting={!!selected}
            {opponentAway}
            clockHint={!online && !started}
            canPass={blocked && !waiting && myTurn}
            canResign={!waiting}
            {error}
            onresult={() => (modal = 'result')}
            onpass={pass}
            onresign={() => (modal = 'resign')}
        />
        <footer class="absolute bottom-[3%] left-[26%] hidden w-[50%] rounded bg-[#f3e3c8]/90 py-1 text-center text-[clamp(10px,.8cqw,15px)] uppercase tracking-[.2em] lg:block">{$t('GAME.FOOTER')}</footer>
    </div>
</main>

{#if modal}
    <GameDialog
        {modal}
        title={titles[modal]}
        {outcome}
        reason={game.result?.reason ?? null}
        resignName={seats[online && me >= 0 ? me : game.turn]}
        {online}
        playing={view?.status === 'PLAYING'}
        onclose={() => (modal = null)}
        onrestart={restart}
        onresign={resign}
        onquit={quit}
    />
{/if}
