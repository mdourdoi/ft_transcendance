<script lang="ts">
	import Cell from '$lib/components/game/cell/Cell.svelte';
	import { GameMap, Position } from '../game/index';

	let { 
		width = '100%',
		height = '100%',
		size = 5,
		map = GameMap.initial(),
		selected = null,
		destinations = [],
		disabled = false,
		assetBase = '../assets/game',
		oncell = () => {}}: {
		width?:string;
		height?:string;
		size?:number;
		map?:GameMap;
		selected?:Position|null;
		destinations?:Position[];
		disabled?:boolean;
		assetBase?: string;
		oncell?:(p:Position)=>void
	}=$props();

</script>

<div class="relative grid aspect-square w-full overflow-hidden border-2 border-[#3c2919] bg-[length:100%_100%] bg-no-repeat shadow-inner" style:background-image={`url("../assets/games/ui/board-surface.svg")`} style:grid-template-columns={`repeat(${size},minmax(0,1fr))`} style:grid-template-rows={`repeat(${size},minmax(0,1fr))`} style:width style:height aria-label="Plateau Onitama">
 	{#each Array(size) as _,i (i)}
		{#each Array(size) as _,j (j)}
  			{@const pos = Position.create({row:i, col:j})}
  			{@const entity = map.entityAt(pos)}
  			<Cell {assetBase} {entity} {disabled}
				selected = {selected?.equals(pos) ?? false}
				valid = {destinations.some(p => p.equals(pos))}
				temple = {j === 2 && (i === 0 || i === 4)}
				label = {`${'ABCDE'[j]}${5 - i}`}
				onclick = {() => oncell(pos)}/>
 		{/each}
	{/each}
</div>
