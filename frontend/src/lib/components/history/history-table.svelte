<script lang="ts">
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import HistoryDetails, { type Game } from './history-details.svelte';
	import HistoryReplay from './history-replay.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import type { HistoryManager } from '$lib/stores/history.svelte';
	import { t, locale } from '$lib/i18n';

	let { manager, filter = 'all' }: { manager: HistoryManager; filter?: string } = $props();

	const modeIcons: Record<string, string> = { Ranked: '♛', Normal: '⚔' };
	const dateFormat = $derived(new Intl.DateTimeFormat($locale ?? undefined, { dateStyle: 'short', timeStyle: 'short' }));

	let gameOption: Game | null = $state(null);
	let replayGame: Game | null = $state(null);

	const games = $derived(filter === 'all' ? manager.games : manager.games.filter((game) => game.mode === filter));
</script>

<Card.Root class="shrink-0 bg-card/80 py-0 backdrop-blur-sm">
	<Table.Root>
		<Table.Header class="bg-secondary [&_th]:text-secondary-foreground">
			<Table.Row class="hover:bg-secondary">
				<Table.Head class="pl-4 tracking-widest">{$t('HISTORY.COLUMNS.RESULT')}</Table.Head>
				<Table.Head class="tracking-widest">{$t('HISTORY.COLUMNS.MODE')}</Table.Head>
				<Table.Head class="tracking-widest">{$t('HISTORY.COLUMNS.OPPONENT')}</Table.Head>
				<Table.Head class="tracking-widest">{$t('HISTORY.COLUMNS.DURATION')}</Table.Head>
				<Table.Head class="tracking-widest">{$t('HISTORY.COLUMNS.DATE')}</Table.Head>
				<Table.Head class="w-12"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each games as game (game.id)}
				{@const mode = { label: $t(`HISTORY.MODES.${game.mode.toUpperCase()}`, { default: game.mode }), icon: modeIcons[game.mode] ?? '' }}
				<Table.Row class="hover:bg-accent/60">
					<Table.Cell class="pl-4">
						<div class="flex items-center gap-2">
							<img class="size-6" src={`../assets/home/icone/${game.result === 'Victory' ? 'victoire' : 'defaite'}.png`} alt="" />
							<Badge variant={game.result === 'Victory' ? 'default' : 'secondary'}>
								{$t(game.result === 'Victory' ? 'COMMON.VICTORY' : 'COMMON.DEFEAT')}
							</Badge>
						</div>
					</Table.Cell>
					<Table.Cell>
						<span class="flex items-center gap-2"><span class="text-muted-foreground">{mode.icon}</span>{mode.label}</span>
					</Table.Cell>
					<Table.Cell>
						<span class="flex items-center gap-2">
							<Avatar.Root class="size-7">
								<Avatar.Image src={game.avatar} alt={game.opponent} />
								<Avatar.Fallback>{game.opponent.slice(0, 2)}</Avatar.Fallback>
							</Avatar.Root>
							{game.opponent}
						</span>
					</Table.Cell>
					<Table.Cell class="text-muted-foreground">{game.duration}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{dateFormat.format(new Date(game.date))}</Table.Cell>
					<Table.Cell>
						<Button variant="ghost" size="icon-sm" aria-label={$t('HISTORY.OPTIONS', { values: { opponent: game.opponent } })} onclick={() => (gameOption = game)}>
							<Ellipsis />
						</Button>
					</Table.Cell>
				</Table.Row>
			{:else}
				<Table.Row class="hover:bg-transparent">
					<Table.Cell colspan={6} class="py-8 text-center text-muted-foreground">
						{manager.loading ? $t('COMMON.LOADING') : manager.error ? $t(`ERRORS.${manager.error}`, { default: manager.error }) : $t('HISTORY.EMPTY')}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</Card.Root>

{#if manager.nextCursor !== null}
	<Button variant="outline" class="shrink-0 self-center" disabled={manager.loading} onclick={() => manager.loadMore()}>
		{manager.loading ? $t('COMMON.LOADING') : $t('COMMON.LOAD_MORE')}
	</Button>
{/if}

{#if gameOption}
	<HistoryDetails
		game={gameOption}
		onclose={() => (gameOption = null)}
		onreplay={() => {
			replayGame = gameOption;
			gameOption = null;
		}}
	/>
{/if}

{#if replayGame}
	<HistoryReplay game={replayGame} onclose={() => (replayGame = null)} />
{/if}
