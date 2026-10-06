<script lang="ts">
	import { onMount } from 'svelte';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import History_Details, { type Game } from './History_Details.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { InkQuote, PageShell, SideNav } from '$lib/components/onitama';
	import { historyManager } from '../utils/history.svelte';

	const filters = [
		{ value: 'all', label: 'Toutes' },
		{ value: 'Ranked', label: 'Classées' },
		{ value: 'Normal', label: 'Normales' },
	];

	const modeInfo: Record<string, { label: string; icon: string }> = {
		Ranked: { label: 'Classée', icon: '♛' },
		Normal: { label: 'Normale', icon: '⚔' },
	};

	let historyFilter = $state('all');
	let gameOption: Game | null = $state(null);

	const games = $derived(
		historyFilter === 'all' ? historyManager.games : historyManager.games.filter((game) => game.mode === historyFilter)
	);

	onMount(() => {
		historyManager.load();
	});
</script>

<Tabs.Root bind:value={historyFilter} orientation="vertical" class="h-full">
	<PageShell title="Historique des parties" subtitle="Chaque partie laisse une trace.">
		{#snippet sidebar()}
			<SideNav label="Filtrer les parties" items={filters} />
			<InkQuote class="mt-auto" quote="Apprendre d’hier pour mieux jouer demain." author="" stamp />
		{/snippet}

		<Card.Root class="shrink-0 bg-card/80 py-0 backdrop-blur-sm">
			<Table.Root>
				<Table.Header class="bg-secondary [&_th]:text-secondary-foreground">
					<Table.Row class="hover:bg-secondary">
						<Table.Head class="pl-4 tracking-widest">RÉSULTAT</Table.Head>
						<Table.Head class="tracking-widest">MODE</Table.Head>
						<Table.Head class="tracking-widest">ADVERSAIRE</Table.Head>
						<Table.Head class="tracking-widest">DURÉE</Table.Head>
						<Table.Head class="tracking-widest">DATE</Table.Head>
						<Table.Head class="w-12"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each games as game (game.id)}
						{@const mode = modeInfo[game.mode] ?? { label: game.mode, icon: '' }}
						<Table.Row class="hover:bg-accent/60">
							<Table.Cell class="pl-4">
								<div class="flex items-center gap-2">
									<img class="size-6" src={`../assets/home/icone/${game.result === 'Victory' ? 'victoire' : 'defaite'}.png`} alt="" />
									<Badge variant={game.result === 'Victory' ? 'default' : 'secondary'}>
										{game.result === 'Victory' ? 'Victoire' : 'Défaite'}
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
							<Table.Cell class="text-muted-foreground">{game.date}</Table.Cell>
							<Table.Cell>
								<Button variant="ghost" size="icon-sm" aria-label={`Options de la partie contre ${game.opponent}`} onclick={() => (gameOption = game)}>
									<Ellipsis />
								</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row class="hover:bg-transparent">
							<Table.Cell colspan={6} class="py-8 text-center text-muted-foreground">
								{historyManager.loading ? 'Chargement…' : (historyManager.error ?? 'Aucune partie pour le moment.')}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Root>

		{#if historyManager.nextCursor !== null}
			<Button variant="outline" class="shrink-0 self-center" disabled={historyManager.loading} onclick={() => historyManager.loadMore()}>
				{historyManager.loading ? 'Chargement…' : 'Charger plus'}
			</Button>
		{/if}
	</PageShell>
</Tabs.Root>

{#if gameOption}
	<History_Details game={gameOption} onclose={() => (gameOption = null)} />
{/if}
