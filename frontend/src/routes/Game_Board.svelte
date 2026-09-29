<script lang="ts">
	import { Position } from '../lib/components/game/game/position';
	import { Button } from '$lib/components/ui/button';

</script>

<div class="Board">
	<img src="" class="">
	{#each Array(25) as _, i}
		<Button variant="ghost" class="cell">

		</Button>
	{/each}
	{#each piece as {position:p,entity:e} (e)}
		<img src="" class="Pieces">
	{/each}
</div>

<style>
	
</style>