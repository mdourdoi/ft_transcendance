<script lang="ts">
	import { onMount } from 'svelte';
	import ChevronFirst from '@lucide/svelte/icons/chevron-first';
	import ChevronLast from '@lucide/svelte/icons/chevron-last';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import Plateau from '$lib/components/game/plateau/Plateau.svelte';
	import MoveCard from '$lib/components/game/move/MoveCard.svelte';
	import { card, Position } from '$lib/components/game/game/index';
	import { createGame, passTurn, playMove } from '$lib/components/game/game/engine';
	import type { GameState, Player } from '$lib/components/game/game/engine';
	import { authFetch } from '$lib/auth';
	import { t } from '$lib/i18n';
	import type { Game, ReplayData } from './History_Details.svelte';

	const ASSETS = '../assets/game';
	const PLAY_INTERVAL_MS = 1000;
	const BALANCED_MARGIN = 5;

	let { game, onclose }: { game: Game; onclose: () => void } = $props();

	let step = $state(0);
	let playing = $state(false);
	let advantages = $state<number[] | null>(null);
	let analysed = $state(false);

	const me = $derived((game.playerIndex === 1 ? 1 : 0) as Player);
	const flipped = $derived(me === 1);
	const states = $derived(replayStates(game.replay));
	const total = $derived(states.length - 1);
	const shown = $derived(states[Math.min(step, total)]);
	const lastMove = $derived(step > 0 ? game.replay?.moves[step - 1] : undefined);
	const names = $derived(me === 0 ? [$t('GAME.ME'), game.opponent] : [game.opponent, $t('GAME.ME')]);
	const share = $derived.by(() => {
		const first = advantages?.[step];
		if (first === undefined) return null;
		return me === 0 ? first : 100 - first;
	});
	const verdict = $derived.by(() => {
		if (share === null) return $t(analysed ? 'HISTORY.REPLAY.NO_ANALYSIS' : 'COMMON.LOADING');
		if (Math.abs(share - 50) <= BALANCED_MARGIN) return $t('HISTORY.REPLAY.BALANCED');
		return $t('HISTORY.REPLAY.ADVANTAGE', { values: { name: share > 50 ? $t('GAME.ME') : game.opponent } });
	});
	const caption = $derived.by(() => {
		if (!lastMove) return $t('HISTORY.REPLAY.START');
		const values = {
			name: names[states[step - 1].turn],
			card: $t(`CARDS.${lastMove.card.toUpperCase()}`, { default: lastMove.card }),
		};
		return $t(lastMove.from ? 'HISTORY.REPLAY.MOVE' : 'HISTORY.REPLAY.PASS', { values });
	});

	function replayStates(replay: ReplayData | null | undefined): GameState[] {
		if (!replay) return [createGame()];
		const cards = [...replay.hands[0], ...replay.hands[1], replay.neutral].map(card);
		let state: GameState = { ...createGame(cards), turn: replay.moves[0]?.from?.row === 0 ? 1 : 0 };
		const all = [state];
		try {
			for (const move of replay.moves) {
				const index = state.hands[state.turn].findIndex((held) => held.name === move.card);
				state =
					move.from && move.to
						? playMove(state, Position.create(move.from), Position.create(move.to), index)
						: passTurn(state, index);
				all.push(state);
			}
		} catch {
			return all;
		}
		return all;
	}

	function go(target: number) {
		step = Math.max(0, Math.min(total, target));
	}

	function toggle() {
		if (!playing && step === total) step = 0;
		playing = !playing;
	}

	function keys(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') go(step - 1);
		else if (event.key === 'ArrowRight') go(step + 1);
	}

	onMount(async () => {
		try {
			const res = await authFetch(`/api/matches/${game.id}/analysis`);
			if (res.ok) advantages = (await res.json()).advantages;
		} catch {
			advantages = null;
		}
		analysed = true;
	});

	$effect(() => {
		if (!playing) return;
		const id = setInterval(() => {
			if (step >= total) playing = false;
			else step += 1;
		}, PLAY_INTERVAL_MS);
		return () => clearInterval(id);
	});
</script>

<svelte:window onkeydown={keys} />

{#snippet hand(owner: Player)}
	<div class="flex flex-col gap-1">
		<span class="truncate text-xs text-muted-foreground">{names[owner]}</span>
		<div class="grid h-32 grid-cols-2 gap-2">
			{#each shown.hands[owner] as held (held.name)}
				<MoveCard assetBase={ASSETS} card={held} player={flipped ? 1 - owner : owner} disabled />
			{/each}
		</div>
	</div>
{/snippet}

<Dialog.Root open onOpenChange={(open) => { if (!open) onclose(); }}>
	<Dialog.Content class="max-h-[92dvh] overflow-y-auto border-4 border-double border-border sm:max-w-3xl">
		<Dialog.Header class="border-b border-border pb-3">
			<span class="text-[10px] tracking-[0.3em] text-muted-foreground">{$t('COMMON.EYEBROW')}</span>
			<Dialog.Title class="font-display text-2xl">{$t('HISTORY.REPLAY.TITLE')}</Dialog.Title>
		</Dialog.Header>

		<div class="flex flex-col gap-1">
			<div class="flex items-baseline justify-between gap-3 text-sm font-medium tabular-nums">
				<span class="truncate">{$t('GAME.ME')}{share === null ? '' : ` · ${share} %`}</span>
				<span class="truncate text-right">{share === null ? '' : `${100 - share} % · `}{game.opponent}</span>
			</div>
			<div
				role="meter"
				aria-label={$t('HISTORY.REPLAY.METER')}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={share ?? 50}
				class="relative h-3 overflow-hidden rounded-full bg-secondary"
			>
				<div class="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style:width={`${share ?? 50}%`}></div>
				<span class="absolute inset-y-0 left-1/2 w-px bg-background/70"></span>
			</div>
			<p class="text-xs text-muted-foreground" aria-live="polite">{verdict}</p>
		</div>

		<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
			<div class="mx-auto w-full max-w-[26rem]">
				<Plateau
					assetBase={ASSETS}
					map={shown.map}
					{flipped}
					selected={lastMove?.to ? Position.create(lastMove.to) : null}
					destinations={lastMove?.from ? [Position.create(lastMove.from)] : []}
					disabled
				/>
			</div>
			<div class="flex flex-col justify-between gap-3">
				{@render hand((1 - me) as Player)}
				<div class="mx-auto h-32 w-[calc(50%-0.25rem)]">
					{#key shown.side.name}
						<MoveCard assetBase={ASSETS} card={shown.side} player={flipped ? 1 - shown.turn : shown.turn} disabled />
					{/key}
				</div>
				{@render hand(me)}
			</div>
		</div>

		<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
			<p class="min-w-0 flex-1 truncate text-sm" aria-live="polite">{caption}</p>
			<span class="text-xs tabular-nums text-muted-foreground">{$t('GAME.MOVE_COUNTER', { values: { step, total } })}</span>
			<div class="flex items-center gap-1">
				<Button variant="outline" size="icon-sm" aria-label={$t('HISTORY.REPLAY.FIRST')} disabled={step === 0} onclick={() => go(0)}><ChevronFirst /></Button>
				<Button variant="outline" size="icon-sm" aria-label={$t('GAME.PREVIOUS_MOVE')} disabled={step === 0} onclick={() => go(step - 1)}><ChevronLeft /></Button>
				<Button size="icon-sm" aria-label={$t(playing ? 'HISTORY.REPLAY.PAUSE' : 'HISTORY.REPLAY.PLAY')} disabled={total === 0} onclick={toggle}>
					{#if playing}<Pause />{:else}<Play />{/if}
				</Button>
				<Button variant="outline" size="icon-sm" aria-label={$t('GAME.NEXT_MOVE')} disabled={step === total} onclick={() => go(step + 1)}><ChevronRight /></Button>
				<Button variant="outline" size="icon-sm" aria-label={$t('HISTORY.REPLAY.LAST')} disabled={step === total} onclick={() => go(total)}><ChevronLast /></Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
