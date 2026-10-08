<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import UserCheck from '@lucide/svelte/icons/user-check';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import { Button } from '$lib/components/ui/button';
	import { friendManager } from '$lib/stores/friend.svelte';
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n';

	let { player }: { player: { id: number; username: string } } = $props();

	let sending = $state(false);
	let added = $state(false);
	let error = $state('');

	const status = $derived(
		friendManager.friends.some((f) => f.user?.id === player.id)
			? 'friend'
			: friendManager.sent.some((f) => f.user?.id === player.id)
				? 'pending'
				: 'add'
	);

	$effect(() => {
		void player.id;
		error = '';
		added = false;
	});

	async function add() {
		sending = true;
		error = await friendManager.send_request(player.username);
		added = !error;
		sending = false;
	}
</script>

<div class="flex flex-col items-end gap-2">
	<Button
		variant={status === 'add' ? 'default' : 'secondary'}
		disabled={status !== 'add' || sending}
		class={cn('relative transition-colors duration-300 disabled:opacity-100', added && 'animate-in zoom-in-90 duration-300')}
		onclick={add}
	>
		{#if added}
			<span class="pointer-events-none absolute inset-0 animate-ping rounded-[inherit] bg-primary/50 [animation-iteration-count:1]" aria-hidden="true"></span>
		{/if}
		{#key status}
			<span class="flex animate-in items-center gap-1.5 duration-500 zoom-in-50 spin-in-12 fade-in-0">
				{#if status === 'friend'}
					<UserCheck />
					{$t('PLAYER.FRIEND')}
				{:else if status === 'pending'}
					<Check />
					{$t('PLAYER.REQUEST_SENT')}
				{:else}
					<UserPlus />
					{$t('PLAYER.ADD_FRIEND')}
				{/if}
			</span>
		{/key}
	</Button>
	{#if error}
		<p role="alert" class="text-sm text-destructive">{$t(`ERRORS.${error}`, { default: $t('ERRORS.UNKNOWN_ERROR') })}</p>
	{/if}
</div>
