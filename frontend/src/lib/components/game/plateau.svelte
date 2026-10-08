<script lang="ts">
	import Cell from '$lib/components/game/cell.svelte';
	import { GameMap, Position } from '$lib/game/index';
	import { t } from '$lib/i18n';

	let { 
		map = GameMap.initial(),
		selected = null,
		destinations = [],
		disabled = false,
		flipped = false,
		assetBase = '../assets/game',
		oncell = () => {}}: {
		map?:GameMap;
		selected?:Position|null;
		destinations?:Position[];
		disabled?:boolean;
		flipped?:boolean;
		assetBase?: string;
		oncell?:(p:Position)=>void
	}=$props();

	const size = 5;

</script>

<div class="relative grid aspect-square w-full overflow-hidden border-2 border-[#3c2919] bg-[length:100%_100%] bg-no-repeat shadow-inner" style:background-image={`url("../assets/games/ui/board-surface.svg")`} style:grid-template-columns={`repeat(${size},minmax(0,1fr))`} style:grid-template-rows={`repeat(${size},minmax(0,1fr))`} aria-label={$t('GAME.BOARD_LABEL')}>
 	{#each Array(size) as _,i (i)}
		{#each Array(size) as _,j (j)}
  			{@const pos = Position.create(flipped ? {row:size - 1 - i, col:size - 1 - j} : {row:i, col:j})}
  			{@const entity = map.entityAt(pos)}
  			<Cell {assetBase} {entity} {disabled}
				selected = {selected?.equals(pos) ?? false}
				valid = {destinations.some(p => p.equals(pos))}
				temple = {pos.col === 2 && (pos.row === 0 || pos.row === 4)}
				label = {`${'ABCDE'[pos.col]}${5 - pos.row}`}
				onclick = {() => oncell(pos)}/>
 		{/each}
	{/each}
</div>
