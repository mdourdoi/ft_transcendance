<script lang="ts" module>
	export type ReplaySquare = { row: number; col: number };

	export type ReplayData = {
		hands: [string[], string[]];
		neutral: string;
		moves: { card: string; from: ReplaySquare | null; to: ReplaySquare | null }[];
	};

	export type Game = {
		id: string;
		result: string;
		mode: string;
		opponent: string;
		opponentId?: string;
		avatar: string;
		duration: string;
		date: string;
		reason?: string;
		xpEarned?: number;
		ratingDelta?: number;
		movesCount?: number;
		playerIndex?: number;
		replay?: ReplayData | null;
	};
</script>

<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Dialog from '$lib/components/ui/dialog';
	import { t, locale } from '$lib/i18n';

	let { game, onclose, onreplay }: { game: Game; onclose: () => void; onreplay: () => void } = $props();

	const dateFormat = $derived(new Intl.DateTimeFormat($locale ?? undefined, { dateStyle: 'short', timeStyle: 'short' }));

	const details = $derived([
		{ label: $t('HISTORY.DETAILS.MODE'), value: $t(`HISTORY.MODES.${game.mode.toUpperCase()}`, { default: game.mode }) },
		{ label: $t('HISTORY.DETAILS.DURATION'), value: game.duration },
		{ label: $t('HISTORY.DETAILS.END'), value: game.reason ? $t(`HISTORY.END_REASONS.${game.reason}`, { default: game.reason }) : $t('HISTORY.DETAILS.UNKNOWN') },
		{ label: $t('HISTORY.DETAILS.XP'), value: game.xpEarned ?? '—' },
		{ label: $t('HISTORY.DETAILS.RATING'), value: game.ratingDelta == null ? '—' : `${game.ratingDelta > 0 ? '+' : ''}${game.ratingDelta}` },
		{ label: $t('HISTORY.DETAILS.MOVES'), value: game.movesCount ?? '—' },
	]);
</script>

<Dialog.Root open onOpenChange={(open) => { if (!open) onclose(); }}>
	<Dialog.Content class="border-4 border-double border-border sm:max-w-xl">
		<Dialog.Header class="border-b border-border pb-3">
			<span class="text-[10px] tracking-[0.3em] text-muted-foreground">{$t('COMMON.EYEBROW')}</span>
			<Dialog.Title class="font-display text-2xl">{$t('HISTORY.DETAILS.TITLE')}</Dialog.Title>
		</Dialog.Header>

		<div class="flex items-center gap-4">
			<Avatar.Root class="size-14">
				<Avatar.Image src={game.avatar} alt="" />
				<Avatar.Fallback>{game.opponent.slice(0, 2)}</Avatar.Fallback>
			</Avatar.Root>
			<div class="min-w-0 flex-1">
				<strong class="text-lg">{game.opponent}</strong>
				<p class="text-xs text-muted-foreground">{dateFormat.format(new Date(game.date))}</p>
			</div>
			<Badge variant={game.result === 'Victory' ? 'default' : 'secondary'} class="text-sm">
				{$t(game.result === 'Victory' ? 'COMMON.VICTORY' : 'COMMON.DEFEAT')}
			</Badge>
		</div>

		<dl class="grid grid-cols-2 gap-3">
			{#each details as item (item.label)}
				<div class="rounded-md border border-border bg-muted/40 p-3">
					<dt class="text-xs text-muted-foreground">{item.label}</dt>
					<dd class="mt-1 font-medium">{item.value}</dd>
				</div>
			{/each}
		</dl>

		<Button disabled={!game.replay?.moves.length} onclick={onreplay}>{$t('HISTORY.REPLAY.OPEN')}</Button>
	</Dialog.Content>
</Dialog.Root>
