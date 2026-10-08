<script lang="ts">
    import { onMount } from 'svelte';
    import { fly, scale } from 'svelte/transition';
    import Plateau from '../lib/components/game/plateau/Plateau.svelte';
    import MoveCard from '../lib/components/game/move/MoveCard.svelte';
    import { card } from '../lib/components/game/game/index';
    import type { Position } from '../lib/components/game/game/index';
    import { createGame, legalMoves, canMove, playMove, passTurn } from '../lib/components/game/game/engine';
    import type { GameState, Player } from '../lib/components/game/game/engine';
    import { liveClocks, toGameState } from '../lib/components/game/game/online';
    import { BOT_ID, BOT_LEVELS, botLevel, currentUserId, playOnline } from '$lib/game-socket';
    import type { GameStateView, OnlineGame } from '$lib/game-socket';
    import { authFetch } from '$lib/auth';
    import { navigate } from '$lib/router';
    import { t } from '$lib/i18n';
    import { friendManager } from '../utils/friend.svelte';

    type Modal = 'rules' | 'resign' | 'exit' | 'result';

    let { mode }: { mode?: string } = $props();

    const names: [string, string] = ['RaiNeko', 'Kenshii'];
    const asset = '../assets/game';

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
    let dialog = $state<HTMLDialogElement>();
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

    const bg = (name: string) => `background-image: url('${asset}/ui/${name}.svg')`;
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
        return `${asset}/avatars/${owner === 1 ? 'ronin' : 'kunoichi'}.png`;
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
    $effect(() => {
        if (!modal || !dialog)
            return;
        const element = dialog;
        const previous = document.activeElement as HTMLElement | null;
        element.showModal();
        return () => {
            element.close();
            previous?.focus();
        };
    });
</script>

<svelte:window onkeydown={keys} />

<svelte:head>
    <title>{$t('GAME.HEAD_TITLE')}</title>
    <meta name="description" content={$t('GAME.HEAD_DESCRIPTION')}/>
</svelte:head>

<main style="background-image: url('../assets/game/background/dojo.png')" class="min-h-dvh w-full bg-cover bg-center bg-repeat font-brush text-[#241a12] lg:flex lg:items-center">
    <div class="@container relative isolate mx-auto flex w-full max-w-xl flex-col gap-3 p-3 lg:block lg:aspect-[3/2] lg:w-[min(100%,150dvh)] lg:max-w-[1800px] lg:p-0">
        <img src="../assets/game/decor/sakura.png" alt="" aria-hidden="true" draggable="false" class="pointer-events-none absolute -left-[2%] top-0 -z-10 hidden w-[27%] lg:block" />
        <img src="../assets/game/decor/pagoda.png" alt="" aria-hidden="true" draggable="false" class="pointer-events-none absolute right-[2%] top-[8%] -z-10 hidden w-[15%] opacity-80 lg:block" />
        <img src="../assets/game/decor/ronin.png" alt="" aria-hidden="true" draggable="false" class="pointer-events-none absolute bottom-[9%] left-[2%] -z-10 hidden h-[28%] w-[13%] object-contain lg:block" />
        <img src="../assets/game/ui/onitama.png" alt="Onitama" class="absolute left-[1%] top-[1%] hidden h-[15%] w-[21%] object-contain lg:block" />
        <header class="order-1 mx-auto w-full max-w-sm text-center lg:absolute lg:left-[39%] lg:top-[3%] lg:w-[26%] lg:max-w-none">
            <h1 class="ink-banner py-[5%] text-[clamp(18px,1.65cqw,29px)]" style={bg('brush-black')}>{title}</h1>
            <p class="mt-1 text-[clamp(12px,1cqw,17px)]">{$t('GAME.TAGLINE')}</p>
        </header>
        <nav aria-label={$t('GAME.MENU_LABEL')} class="order-2 flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-md bg-[#f4dfbc]/90 px-2 py-2 text-[clamp(14px,1.2cqw,22px)] shadow-sm lg:absolute lg:left-[1.5%] lg:top-[19%] lg:w-[12.5%] lg:flex-col lg:items-stretch lg:gap-[1.3cqw] lg:py-3">
            <button type="button" class="ink-banner px-4 py-1 text-left lg:py-[6%]" style={bg('brush-black')} onclick={()=>modal='exit'}>‹ {$t('COMMON.BACK')}</button>
            <span class="ink-banner hidden px-3 py-[6%] italic lg:block" style={bg('brush-red')}>{$t('GAME.IN_PROGRESS')}</span>
            <button type="button" class="text-left italic hover:text-red-800 lg:pl-3" onclick={()=>modal='rules'}>{$t('GAME.RULES')}</button>
            <div class="flex items-center justify-between gap-3 lg:gap-1 lg:border-t lg:border-[#80603e]/50 lg:pt-2">
                <button type="button" class="px-2 text-[1.4em] leading-none disabled:opacity-30" aria-label={$t('GAME.PREVIOUS_MOVE')} title={`${$t('GAME.PREVIOUS_MOVE')} (←)`} disabled={step === 0} onclick={back}>‹</button>
                <span class="text-[.8em] tabular-nums" aria-live="polite">{$t('GAME.MOVE_COUNTER', { values: { step, total: past.length } })}</span>
                <button type="button" class="px-2 text-[1.4em] leading-none disabled:opacity-30" aria-label={$t('GAME.NEXT_MOVE')} title={`${$t('GAME.NEXT_MOVE')} (→)`} disabled={!reviewing} onclick={forward}>›</button>
            </div>
            {#if reviewing}
                <button type="button" class="ink-banner px-3 py-[4%] text-[.8em]" style={bg('brush-red')} onclick={()=>cursor=null}>{$t('GAME.BACK_TO_LIVE')}</button>
            {/if}
        </nav>
        {#each players as owner}
            <section aria-label={$t('GAME.PLAYER', { values: { name: seats[owner] } })} class="asset-fill flex flex-row items-center gap-3 px-4 py-3 drop-shadow-lg max-lg:rounded-md max-lg:border-[3px] max-lg:border-double max-lg:border-[#6b4a2b] max-lg:bg-[#f4dfbc] max-lg:bg-none! lg:absolute lg:top-[17%] lg:h-[46%] lg:w-[17%] lg:flex-col lg:items-stretch lg:gap-0 lg:p-[1.35%]" style={bg('player-panel')} style:left={owner === 1 ? '16%' : '69%'} style:order={owner === (flipped ? 1 : 0) ? 5 : 3}>
                <div class="flex min-w-0 flex-1 flex-col lg:contents">
                    <div class="flex min-h-0 items-center gap-[6%] lg:h-[21%]">
                        <div class="relative aspect-square w-12 shrink-0 lg:w-[30%]">
                            <img src={avatarOf(owner)} alt="" class="h-full w-full rounded-full object-cover" />
                            <img src="../assets/game/ui/avatar-ring.svg" alt="" class="pointer-events-none absolute inset-0 h-full w-full" />
                        </div>
                        <div class="min-w-0">
                            <h2 class="line-clamp-2 text-[clamp(14px,1.2cqw,22px)] leading-tight font-bold break-all" title={seats[owner]}>{seats[owner]}</h2>
                            <p class="mt-1 text-[clamp(11px,.85cqw,16px)]">{$t((owner === 1) !== flipped ? 'GAME.NORTH' : 'GAME.SOUTH')} · {$t(owner === 1 ? 'GAME.RED' : 'GAME.BLACK')}</p>
                        </div>
                    </div>
                    <div class="ink-banner relative isolate my-[3%] flex min-h-[56px] shrink-0 items-center justify-center gap-3 text-[clamp(25px,2.2cqw,39px)] leading-none tabular-nums lg:h-[18%] lg:min-h-[65px]" aria-label={$t('GAME.CLOCK', { values: { name: seats[owner], time: time(clocks[owner]) } })}>
                        <svg viewBox="0 0 400 150" preserveAspectRatio="none" aria-hidden="true" class="absolute inset-0 -z-10 h-full w-full fill-[#191713]"><path d="M38 70C30 42 62 22 104 24c30 1 44-12 82-10 34 2 52 12 88 8 44-5 86 8 92 40 5 26-14 44-48 50-30 5-50-4-84 4-36 8-66 14-106 6-34-7-46-4-70-18C40 94 42 84 38 70Z"/><path d="M96 26c-8-10-4-18 6-20 6 8 4 16-6 20ZM300 122c10 6 12 16 4 22-8-6-10-14-4-22ZM356 44c12-8 22-6 26 2-8 8-18 8-26-2Z"/><circle cx="22" cy="48" r="6"/><circle cx="13" cy="94" r="4"/><circle cx="388" cy="98" r="7"/><circle cx="352" cy="130" r="4"/><circle cx="60" cy="130" r="5"/><circle cx="200" cy="141" r="3"/><circle cx="330" cy="9" r="3"/><circle cx="44" cy="22" r="3"/></svg>
                        <img src="../assets/game/icons/clock.svg" alt="" class="h-[1.8cqw] min-h-5 w-[1.8cqw] min-w-5 brightness-0 invert" />{time(clocks[owner])}
                    </div>
                    <p class="ink-banner mb-[3%] flex min-h-7 shrink-0 items-center justify-center text-center text-[clamp(11px,.95cqw,17px)] lg:h-[10%] lg:min-h-0 {active(owner) ? 'motion-safe:animate-pulse' : ''}" style={bg('brush-black')}>{$t(!active(owner) ? 'GAME.CARDS_IN_HAND' : online && owner !== me ? 'GAME.OPPONENT_TURN' : 'GAME.YOUR_TURN')}</p>
                </div>
                <div class="grid h-36 w-40 shrink-0 grid-cols-2 gap-[5%] lg:h-auto lg:min-h-0 lg:w-auto lg:flex-1 lg:shrink">
                    {#each online && !view ? [] : shown.hands[owner] as handCard,i}
                        {#key handCard.name}
                            <div class="h-full min-h-0" in:fly={{y:-18,duration:320}}>
                                <MoveCard assetBase={asset} card={handCard} player={flipped ? 1 - owner : owner} selected={playable(owner) && cardIndex === i} disabled={!playable(owner)} onclick={()=>{cardIndex=i;error='';}} />
                            </div>
                        {/key}
                    {/each}
                </div>
            </section>
        {/each}
        <section aria-label={$t('GAME.BOARD')} class="asset-fill relative order-4 mx-auto aspect-square w-full max-w-[70dvh] bg-[#eed7b4] shadow-xl lg:absolute lg:left-[34%] lg:top-[17%] lg:aspect-auto lg:h-[51%] lg:w-[34%] lg:max-w-none" style={bg('board-frame')}>
            <div class="absolute inset-x-0 top-[1%] flex h-[6%] items-center justify-center gap-3 text-sm uppercase tracking-[.25em]"><span class="h-2 w-2 rounded-full" class:bg-red-800={!flipped} class:bg-[#211b16]={flipped}></span>{$t('GAME.NORTH')}</div>
            <div class="absolute inset-[8%]">
                <Plateau assetBase={asset} map={shown.map} {flipped} selected={reviewing ? null : selected} {destinations} disabled={locked || !myTurn} oncell={choose} />
                {#if waiting}
                    <div role="status" class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#211b16]/75 text-center text-[#f2dec2]">
                        <span class="h-8 w-8 rounded-full border-4 border-[#f2dec2]/30 border-t-[#f2dec2] motion-safe:animate-spin" aria-hidden="true"></span>
                        <p class="text-[clamp(14px,1.3cqw,22px)] italic">{status}</p>
                        {#if !view}
                            <button type="button" class="border border-[#bc965d] px-3 py-1 text-sm" onclick={quit}>{$t('COMMON.CANCEL')}</button>
                        {/if}
                    </div>
                {/if}
            </div>
            <div class="absolute inset-x-0 bottom-[1%] flex h-[6%] items-center justify-center gap-3 text-sm uppercase tracking-[.25em]"><span class="h-2 w-2 rounded-full" class:bg-red-800={flipped} class:bg-[#211b16]={!flipped}></span>{$t('GAME.SOUTH')}</div>
        </section>
        <section aria-label={$t('GAME.EXCHANGE_LABEL')} class="exchange-panel order-7 flex h-44 w-full flex-col items-center lg:absolute lg:left-[32%] lg:top-[70%] lg:h-[23%] lg:w-[38%]">
            <h2 class="ink-banner mb-[2%] w-[67%] py-[2%] text-center text-[clamp(12px,1.05cqw,19px)]" style={bg('brush-black')}>{$t('GAME.EXCHANGE_TITLE')}</h2>
            <div class="flex min-h-0 w-full flex-1 items-center justify-center gap-[6%]">
                <img src="../assets/game/ui/card-back.svg" alt="" aria-hidden="true" class="h-[87%] w-[22%] -rotate-3 object-fill shadow-md" />
                <div class="h-full w-[22%] h-[35%]">
                    {#if !online || view}
                        {#key shown.side.name}
                            <div class="h-full" in:scale={{start:.7,duration:320}}>
                                <MoveCard assetBase={asset} card={shown.side} player={flipped ? 1 - shown.turn : shown.turn} disabled />
                            </div>
                        {/key}
                    {/if}
                </div>
                <img src="../assets/game/ui/card-back.svg" alt="" aria-hidden="true" class="h-[87%] w-[22%] rotate-3 object-fill shadow-md" />
            </div>
        </section>
        <section aria-live="polite" class="asset-fill order-6 flex flex-col justify-center p-5 text-[#f2dec2] drop-shadow-lg max-lg:rounded-md max-lg:border-[3px] max-lg:border-double max-lg:border-[#bc965d] max-lg:bg-[#211b16] max-lg:bg-none! lg:absolute lg:left-[76%] lg:top-[65%] lg:h-[30%] lg:w-[23%] lg:px-[2%] lg:py-[1.5%]" style={bg('info-panel')}>
            <h2 class="text-[clamp(17px,1.7cqw,29px)] italic leading-tight">{status}</h2>
            {#if over}
                <button type="button" class="ink-banner mt-3 self-start px-4 py-3" style={bg('brush-red')} onclick={()=>modal='result'}>{$t('GAME.SHOW_RESULT')}</button>
            {:else}
                <p class="my-[3%] text-[clamp(12px,.95cqw,17px)] text-[#d4bea3]">{$t(selected ? 'GAME.CHOOSE_DESTINATION' : 'GAME.CHOOSE_CARD')}</p>
                <div class="mb-[3%] h-px bg-[#a92324]"></div>
                <p class="text-[clamp(11px,.85cqw,16px)]"><span class="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-600"></span>{$t('GAME.VALID_MOVE')}</p>
                <p class="text-[clamp(11px,.85cqw,16px)]"><span class="mr-2 inline-block h-3 w-3 rounded-full bg-red-600"></span>{$t('GAME.CAPTURE')}</p>
                {#if opponentAway}
                    <p role="status" class="mt-2 text-[clamp(10px,.75cqw,14px)] text-amber-300">{$t('GAME.OPPONENT_AWAY')}</p>
                {/if}
                {#if !online && !started}
                    <p class="mt-2 text-[clamp(10px,.75cqw,14px)] text-[#bda68b]">{$t('GAME.CLOCK_STARTS')}</p>
                {/if}
                {#if blocked && !waiting && myTurn}
                    <button type="button" class="mt-2 border border-[#bc965d] px-2 py-1 text-xs" onclick={pass}>{$t('GAME.PASS')}</button>
                {/if}
                {#if !waiting}
                    <button type="button" class="mt-2 self-start text-xs underline underline-offset-2 hover:text-white" onclick={()=>modal='resign'}>{$t('GAME.RESIGN')}</button>
                {/if}
            {/if}
            {#if error}
                <p role="alert" class="mt-1 text-xs text-red-300">{$t(`ERRORS.${error}`, { default: $t('ERRORS.FORBIDDEN_MOVE') })}</p>
            {/if}
        </section>
        <footer class="absolute bottom-[3%] left-[26%] hidden w-[50%] rounded bg-[#f3e3c8]/90 py-1 text-center text-[clamp(10px,.8cqw,15px)] uppercase tracking-[.2em] lg:block">{$t('GAME.FOOTER')}</footer>
    </div>
</main>

{#if modal}
    <dialog bind:this={dialog} oncancel={(event)=>{event.preventDefault();modal=null;}} aria-labelledby="modal-title" style={bg('parchment')} class="border-[5px] border-double border-[#80603e] fixed inset-0 m-auto max-h-[85dvh] w-[min(560px,92vw)] overflow-y-auto p-7 text-[#241a10] backdrop:bg-black/60">
        <header class="mb-5 flex items-center justify-between gap-5">
            <h2 id="modal-title" class="text-2xl">{titles[modal]}</h2>
            <button onclick={()=>modal=null} aria-label={$t('COMMON.CLOSE')} class="text-3xl">×</button>
        </header>
        {#if modal==='rules'}
            <ol class="space-y-3 pl-5">
                {#each [1, 2, 3, 4, 5, 6, 7] as rule (rule)}
                    <li>{$t(`GAME.RULES_LIST.${rule}`)}</li>
                {/each}
            </ol>
        {:else if modal==='result'}
            <p class="text-xl">{outcome}</p>
            {#if game.result}
                <p class="mt-2">{$t(`GAME.REASONS.${game.result.reason.toUpperCase()}`)}</p>
            {/if}
            <div class="mt-6 flex flex-wrap gap-3">
                <button class="ink-banner bg-red-800 px-5 py-2" onclick={restart}>{$t('GAME.NEW_GAME')}</button>
                <button class="ink-banner px-5 py-2" onclick={()=>modal=null}>{$t('GAME.VIEW_BOARD')}</button>
                {#if online}
                    <button class="ink-banner px-5 py-2" onclick={quit}>{$t('COMMON.QUIT')}</button>
                {/if}
            </div>
        {:else if modal==='resign'}
            <p>{$t('GAME.RESIGN_TEXT', { values: { name: seats[online && me >= 0 ? me : game.turn] } })}</p>
            <button class="ink-banner mt-5 bg-red-800 px-5 py-2" onclick={resign}>{$t('GAME.CONFIRM_RESIGN')}</button>
        {:else}
            {#if online}
                <p>{$t(view?.status === 'PLAYING' ? 'GAME.EXIT_PLAYING' : 'GAME.EXIT_IDLE')}</p>
                <button class="ink-banner mt-5 px-5 py-2" onclick={quit}>{$t('COMMON.QUIT')}</button>
            {:else}
                <p>Route retour a faire</p>
            {/if}
        {/if}
    </dialog>
{/if}

<style>
    .asset-fill, .ink-banner {
        background-size:100% 100%;
        background-position:center;
        background-repeat:no-repeat;
    }
    .ink-banner {
        color:#f6e5cc;
    }
    dialog .ink-banner {
        background:#211b16;
    }
    button {
        cursor:pointer;
    }
    @media (prefers-reduced-motion: no-preference) {
        dialog[open] {
            animation:pop .3s cubic-bezier(.2,1.4,.4,1);
        }
        dialog[open]::backdrop {
            animation:veil .25s ease-out;
        }
    }
    @keyframes pop {
        from { opacity:0; transform:scale(.8) translateY(16px); }
    }
    @keyframes veil {
        from { opacity:0; }
    }
    button:focus-visible {
        outline:3px solid #278978;outline-offset:3px;
    }
</style>
