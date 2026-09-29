<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	let {
		title,
		subtitle,
		class: className,
		children,
	}: { title: string; subtitle?: string; class?: string; children?: Snippet } = $props();
</script>

<header class={cn("flex items-end justify-between gap-4 border-b border-border pb-3", className)}>
	<div class="flex flex-col gap-1">
		<h1 class="font-display text-3xl font-bold tracking-tight">{title}</h1>
		{#if subtitle}
			<p class="text-sm text-muted-foreground italic">« {subtitle} »</p>
		{/if}
	</div>
	{@render children?.()}
</header>
