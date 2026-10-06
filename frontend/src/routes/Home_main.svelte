<script lang="ts">
	import Accueil from './Accueil.svelte';
	import Profil from './Profil.svelte';
	import History from './History.svelte';
	import Stat from './Stat.svelte';
	import Friends from './Friends.svelte';
	import Sakura from './SakuraPetals.svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n';

	type Onglet = 'home' | 'historique' | 'stats' | 'profil';

	const onglets: { id: Onglet; label: string; icon: string }[] = [
		{ id: 'home', label: 'NAV.HOME', icon: 'accueil' },
		{ id: 'historique', label: 'NAV.HISTORY', icon: 'history' },
		{ id: 'stats', label: 'NAV.STATS', icon: 'stats' },
		{ id: 'profil', label: 'NAV.PROFILE', icon: 'profil' },
	];

	let onglet: Onglet = $state('home');
	let sakura: Sakura | undefined = $state();
</script>

<Sakura bind:this={sakura} zIndex={200} />

<div class="relative h-screen w-screen overflow-hidden">
	<img
		class="pointer-events-none fixed inset-0 size-full select-none"
		src="../assets/home/background/background.png"
		alt=""
	/>
	<div class="relative grid h-full grid-cols-[minmax(0,1fr)_var(--friends-width)] grid-rows-[var(--topbar-height)_minmax(0,1fr)]">
		<header class="grid grid-cols-[22vw_minmax(0,1fr)] items-center">
			<Button
				variant="ghost"
				class="ml-[4vw] h-[11vh] w-auto p-0 hover:bg-transparent"
				aria-label="Onitama"
				onclick={() => sakura?.launchBurst()}
			>
				<img class="h-full w-auto rounded-lg object-contain" src="../assets/home/logo/onitama.png" alt="Onitama" />
			</Button>
			<nav class="flex items-center justify-center gap-[2vw]" aria-label={$t('NAV.MAIN')}>
				{#each onglets as item (item.id)}
					{@const active = onglet === item.id}
					<Button
						variant="ghost"
						aria-current={active ? 'page' : undefined}
						class={cn(
							'h-auto flex-col gap-1 px-4 py-2 font-display text-lg text-foreground/80 italic hover:bg-transparent hover:text-foreground',
							active && 'text-primary underline decoration-2 underline-offset-4 hover:text-primary'
						)}
						onclick={() => (onglet = item.id)}
					>
						<img
							class="pointer-events-none h-[4.5vh] w-auto object-contain"
							src={`../assets/home/icone/${item.icon}${active ? '_active' : ''}.png`}
							alt=""
						/>
						{$t(item.label)}
					</Button>
				{/each}
			</nav>
		</header>

		<main class="col-start-1 row-start-2 min-h-0 px-[1.5vw] pb-[3vh]">
			{#if onglet === 'home'}
				<Accueil />
			{:else if onglet === 'profil'}
				<Profil />
			{:else if onglet === 'historique'}
				<History />
			{:else if onglet === 'stats'}
				<Stat />
			{/if}
		</main>

		<div class="col-start-2 row-span-2 row-start-1 min-h-0">
			<Friends />
		</div>
	</div>
</div>
