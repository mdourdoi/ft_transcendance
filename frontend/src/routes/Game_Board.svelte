<script lang="ts">
	import { Position } from '../lib/components/game/game/position';

</script>

<div class="Board">
	<img src="" class="">
	{#each Array(25) as _, i}
		<button class="cell">

		</button>
	{/each}
	{#each piece as {position:p,entity:e} (e)}
		<img src="" class="Pieces">
	{/each}
</div>

<style>
	
</style>