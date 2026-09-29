<script lang="ts">
	import { cn } from "$lib/utils.js";

	let { kanji = "棋", class: className }: { kanji?: string; class?: string } = $props();
</script>

<div
	aria-hidden="true"
	class={cn(
		"flex size-12 items-center justify-center rounded-sm border-2 border-primary/70 bg-primary font-display text-2xl text-primary-foreground shadow-sm",
		className
	)}
>
	{kanji}
</div>
