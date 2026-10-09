<script lang="ts">
	import { onMount } from 'svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { InkQuote, PageShell, SideNav } from '$lib/components/onitama';
	import HistoryTable from '$lib/components/history/history-table.svelte';
	import { historyManager } from '$lib/stores/history.svelte';
	import { t } from '$lib/i18n';

	const filters = $derived([
		{ value: 'all', label: $t('HISTORY.FILTERS.ALL') },
		{ value: 'Ranked', label: $t('HISTORY.FILTERS.RANKED') },
		{ value: 'Normal', label: $t('HISTORY.FILTERS.NORMAL') },
	]);

	let historyFilter = $state('all');

	onMount(() => {
		historyManager.load();
	});
</script>

<Tabs.Root bind:value={historyFilter} orientation="vertical" class="h-full">
	<PageShell title={$t('HISTORY.TITLE')} subtitle={$t('HISTORY.SUBTITLE')}>
		{#snippet sidebar()}
			<SideNav label={$t('HISTORY.FILTER_LABEL')} items={filters} />
			<InkQuote class="mt-auto" quote={$t('HISTORY.QUOTE')} author="" stamp />
		{/snippet}

		<HistoryTable manager={historyManager} filter={historyFilter} />
	</PageShell>
</Tabs.Root>
