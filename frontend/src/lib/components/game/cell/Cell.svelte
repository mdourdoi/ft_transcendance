<script lang="ts">
	import { scale } from 'svelte/transition';
	import type { Entity } from '../game/entity';

	let {
		assetBase = '../assets/game',
		entity = null,
		selected = false,
		valid = false,
		temple = false,
		label = 'Case',
		disabled = false,
		onclick = () => {}
	}: {
		assetBase?: string;
		entity?: Entity | null;
		selected?: boolean;
		valid?: boolean;
		temple?: boolean;
		label?: string;
		disabled?: boolean;
		onclick?: () => void;
	} = $props();

	function asset(path: string): string {
		return `${assetBase.replace(/\/$/, '')}/${path}`;
	}
</script>

<button type="button" {onclick} {disabled} aria-label={label} aria-pressed={selected} class="group relative flex min-h-0 min-w-0 items-center justify-center border border-[#49321b]/70 transition-colors hover:bg-[#fff1cb]/35 focus-visible:z-10" class:ring-4={selected} class:ring-amber-500={selected} style:background={selected ? '#e5b85e77' : 'transparent'}>
	{#if temple}
		<span class="absolute text-[clamp(15px,3vw,44px)] text-[#573922]/20" aria-hidden="true">✦</span>
	{/if}
	{#if entity}
		{#key `${entity.owner}-${entity.kind}`}
			<img in:scale={{start:.5,duration:280}} src={asset(`pieces/${entity.owner === 0 ? 'black' : 'red'}-${entity.isMaster ? 'master' : 'student'}.png`)} alt="" draggable="false" class="pointer-events-none relative z-10 h-[96%] w-[96%] object-contain drop-shadow-md transition-transform motion-safe:group-hover:-translate-y-1"/>
		{/key}
	{/if}
	{#if selected}
		<img src={asset('ui/selected.svg')} alt="" draggable="false" class="pointer-events-none absolute inset-0 z-20 h-full w-full"/>
	{/if}
	{#if valid}
		<img src={asset(`ui/${entity ? 'capture' : 'valid'}.svg`)} alt="" draggable="false" class="pointer-events-none absolute inset-0 z-20 h-full w-full"/>
		<span class="pointer-events-none absolute z-20 rounded-full border-2 border-white/80 shadow-md motion-safe:animate-pulse" class:bg-red-600={!!entity} class:bg-emerald-600={!entity} class:h-4={!entity} class:w-4={!entity} class:inset-2={!!entity} class:opacity-60={!!entity}></span>
	{/if}
</button>