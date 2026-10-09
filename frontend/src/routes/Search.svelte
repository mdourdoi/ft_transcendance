<script lang="ts">
	import { InkQuote, PageShell } from '$lib/components/onitama';
	import PlayerSearch, { type FoundPlayer } from '$lib/components/players/player-search.svelte';
	import Player from './Player.svelte';
	import { t } from '$lib/i18n';

	let { player = $bindable(null) }: { player?: FoundPlayer | null } = $props();
</script>

{#if player}
	<Player {player} />
{:else}
	<PageShell title={$t('SEARCH.TITLE')} subtitle={$t('SEARCH.SUBTITLE')}>
		{#snippet sidebar()}
			<InkQuote class="mt-auto" quote={$t('PROFILE.QUOTE')} author="" stamp />
		{/snippet}

		<PlayerSearch onselect={(found) => (player = found)} />
	</PageShell>
{/if}
