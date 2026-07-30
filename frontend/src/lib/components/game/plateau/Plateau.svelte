<script lang="ts">
    import Cell from "$lib/components/game/cell/Cell.svelte"
    let { width = "3rem", height = "3rem", size = 5 } = $props()
</script>

{#each Array(size) as _, i}
    <div class="grid grid-cols-5">
        {#each Array(size) as _, j}
            <Cell width={width} height={height} color={(i + j) % 2 === 0 ? "white" : "black-800"} />
        {/each}
    </div>
{/each}