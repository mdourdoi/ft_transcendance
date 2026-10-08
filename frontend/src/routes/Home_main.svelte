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
		{
			id: 'home',
			label: 'NAV.HOME',
			icon: 'M1.5 4c3.4 1.3 6.9 1.9 10.5 1.9S19.1 5.3 22.5 4l.6 2.6c-3.6 1.3-7.3 1.9-11.1 1.9S4.5 7.9.9 6.6zM6 8h2.2v12H6zM15.8 8H18v12h-2.2zM4 10.5h16v2H4zM11.1 8h1.8v3h-1.8z',
		},
		{
			id: 'historique',
			label: 'NAV.HISTORY',
			icon: 'M4.5 3h15a1.5 1.5 0 0 1 0 3h-15a1.5 1.5 0 0 1 0-3zM6 7h12v10H6zM8.5 9.5v1.5h7V9.5zM8.5 13v1.5h5V13zM4.5 18h15a1.5 1.5 0 0 1 0 3h-15a1.5 1.5 0 0 1 0-3z',
		},
		{
			id: 'stats',
			label: 'NAV.STATS',
			icon: 'M5 12h2a1 1 0 0 1 1 1v7H4v-7a1 1 0 0 1 1-1zM11 4h2a1 1 0 0 1 1 1v15h-4V5a1 1 0 0 1 1-1zM17 8h2a1 1 0 0 1 1 1v11h-4V9a1 1 0 0 1 1-1z',
		},
		{
			id: 'profil',
			label: 'NAV.PROFILE',
			icon: 'M12 3.5a4 4 0 1 1 0 8a4 4 0 0 1 0-8zM4 19.5c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z',
		},
	];

	let onglet: Onglet = $state('home');
	let sakura: Sakura | undefined = $state();
</script>

<Sakura bind:this={sakura} zIndex={200} />

<div class="relative h-screen w-screen overflow-hidden">
	<img
		class="pointer-events-none fixed inset-0 size-full select-none"
		src="../assets/home/background/background.webp"
		alt=""
	/>
	<div class="relative grid h-full grid-cols-[minmax(0,1fr)_var(--friends-width)] grid-rows-[var(--topbar-height)_minmax(0,1fr)]">
		<header class="grid grid-cols-[22vw_minmax(0,1fr)_22vw] items-center">
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
						<svg class="size-[4.5vh]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d={item.icon} />
						</svg>
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
