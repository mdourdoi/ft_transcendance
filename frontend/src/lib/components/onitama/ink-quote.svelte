<script lang="ts">
	import { cn } from "$lib/utils.js";
	import Stamp from "./stamp.svelte";

	let {
		quote,
		author = "御 寺 間",
		stamp = false,
		class: className,
	}: { quote: string; author?: string; stamp?: boolean; class?: string } = $props();
</script>

<figure class={cn("flex flex-col items-center gap-2 text-center", className)}>
	<blockquote class="text-sm leading-relaxed text-foreground/80 italic">« {quote} »</blockquote>
	{#if author}
		<figcaption class="text-xs tracking-[0.3em] text-muted-foreground">— {author} —</figcaption>
	{/if}
	{#if stamp}
		<Stamp class="mt-2" />
	{/if}
</figure>
