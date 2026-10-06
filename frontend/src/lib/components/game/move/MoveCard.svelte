<script lang="ts">
	import type { Card } from '../game/card';

	let {
		card,
		player = 0,
		selected = false,
		disabled = false,
		assetBase = '../assets/games',
		onclick = () => {}
	}: {
		card: Card;
		player?: number;
		selected?: boolean;
		disabled?: boolean;
		assetBase?: string;
		onclick?: () => void;
	} = $props();

	const names: Record<string, string> = {
		Tiger: 'Tigre',
		Dragon: 'Dragon',
		Frog: 'Grenouille',
		Rabbit: 'Lapin',
		Crab: 'Crabe',
		Elephant: 'Éléphant',
		Goose: 'Oie',
		Rooster: 'Coq',
		Monkey: 'Singe',
		Mantis: 'Mante',
		Horse: 'Cheval',
		Ox: 'Buffle',
		Crane: 'Grue',
		Boar: 'Sanglier',
		Eel: 'Anguille',
		Cobra: 'Serpent'
	};

	const imageSrc = $derived(
		`${assetBase.replace(/\/$/, '')}/cards/${card.name}.png`
	);
	const moves = $derived(card.movesFor(player));
</script>

<button type="button" {disabled} {onclick} aria-pressed={selected} aria-label={`Carte ${names[card.name] ?? card.name}`} class="paper flex h-full min-h-0 w-full flex-col items-center justify-around rounded-md border-[3px] border-double border-[#926039] p-[5%] text-[#20170e] shadow-md transition-transform enabled:hover:-translate-y-1 disabled:opacity-90" class:ring-3={selected} class:ring-red-700={selected}>
	<span class="shrink-0 text-[clamp(12px,1.1vw,18px)]">
		{names[card.name] ?? card.name}
	</span>
	<img src={imageSrc} alt="" draggable="false" class="pointer-events-none h-[40%] min-h-0 w-[95%] shrink-0 object-contain"/>
	<span class="grid aspect-square w-[68%] shrink-0 grid-cols-5 gap-[2px]" aria-label="Déplacements orientés comme le plateau">
		{#each Array(5) as _, r}
			{#each Array(5) as _, c}
				{@const move = moves.some(([dr, dc]) => dr === r - 2 && dc === c - 2)}
				<span class="aspect-square border border-[#aa8f6e]/60" style:background={r === 2 && c === 2 ? '#3e3125' : move ? '#cb3c2e' : '#ffffff25'}></span>
			{/each}
		{/each}
	</span>
</button>