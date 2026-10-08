<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { InkQuote, PageShell, SideNav } from '$lib/components/onitama';
	import { CollapsibleCard, IdentityCard, StatsPanel } from '$lib/components/profile';
	import AddFriendButton from '$lib/components/players/add-friend-button.svelte';
	import HistoryTable from '$lib/components/history/history-table.svelte';
	import type { FoundPlayer } from '$lib/components/players/player-search.svelte';
	import { HistoryManager } from '$lib/stores/history.svelte';
	import { t } from '$lib/i18n';

	let { player }: { player: FoundPlayer } = $props();

	const tabs = $derived([
		{ value: 'profile', label: $t('NAV.PROFILE') },
		{ value: 'history', label: $t('NAV.HISTORY') },
	]);

	const history = $derived(new HistoryManager(player));

	let tab = $state('profile');

	$effect(() => {
		history.load();
	});
</script>

<Tabs.Root bind:value={tab} orientation="vertical" class="h-full">
	<PageShell title={player.username} subtitle={$t('PLAYER.SUBTITLE')}>
		{#snippet sidebar()}
			<SideNav label={$t('PLAYER.TABS_LABEL')} items={tabs} />
			<InkQuote class="mt-auto" quote={$t('PROFILE.QUOTE')} author="" stamp />
		{/snippet}

		{#if tab === 'profile'}
			<IdentityCard name={player.username} avatarUrl={player.avatarUrl} rating={player.rating}>
				<AddFriendButton {player} />
			</IdentityCard>
			<CollapsibleCard title={$t('STATS.TITLE')} description={$t('STATS.SUBTITLE')}>
				<Card.Content class="flex flex-col gap-4">
					<StatsPanel />
				</Card.Content>
			</CollapsibleCard>
		{:else}
			<HistoryTable manager={history} />
		{/if}
	</PageShell>
</Tabs.Root>
