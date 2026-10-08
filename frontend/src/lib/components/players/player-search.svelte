<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import { authFetch } from '$lib/auth';
	import { t } from '$lib/i18n';

	export type FoundPlayer = { id: number; username: string; avatarUrl: string; rating: number };

	let { onselect }: { onselect: (player: FoundPlayer) => void } = $props();

	let query = $state('');
	let results = $state<FoundPlayer[]>([]);
	let searched = $state(false);

	$effect(() => {
		const q = query.trim();
		searched = false;
		if (!/^[a-zA-Z0-9]{1,24}$/.test(q)) {
			results = [];
			return;
		}
		const timer = setTimeout(async () => {
			try {
				const res = await authFetch(`/api/users/search?q=${encodeURIComponent(q)}`);
				if (q !== query.trim()) return;
				results = res.ok ? await res.json() : [];
			} catch {
				results = [];
			}
			searched = true;
		}, 250);
		return () => clearTimeout(timer);
	});
</script>

<Card.Root class="shrink-0 bg-card/80 backdrop-blur-sm">
	<Card.Content class="flex flex-col gap-3">
		<Input type="search" autocomplete="off" maxlength={24} placeholder={$t('SEARCH.PLACEHOLDER')} class="bg-card" bind:value={query} />
		<div class="flex flex-col gap-1">
			{#each results as player (player.id)}
				<Button variant="ghost" class="h-auto justify-start gap-3 px-2 py-1.5" onclick={() => onselect(player)}>
					<Avatar.Root class="size-10">
						<Avatar.Image src={`/api/avatars/${player.avatarUrl}`} alt={player.username} />
						<Avatar.Fallback>{player.username.slice(0, 2)}</Avatar.Fallback>
					</Avatar.Root>
					<strong class="truncate text-sm">{player.username}</strong>
					<span class="ml-auto text-xs text-muted-foreground">{$t('PROFILE.ELO', { values: { elo: player.rating } })}</span>
				</Button>
			{:else}
				<p class="py-6 text-center text-sm text-muted-foreground">
					{$t(searched ? 'SEARCH.EMPTY' : 'SEARCH.HINT')}
				</p>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
