<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import PageHeader from "./page-header.svelte";

	let {
		title,
		subtitle,
		class: className,
		sidebar,
		actions,
		children,
	}: {
		title: string;
		subtitle?: string;
		class?: string;
		sidebar?: Snippet;
		actions?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class={cn("grid h-full min-h-0 w-full grid-cols-[clamp(170px,14vw,220px)_minmax(0,1fr)] gap-6", className)}>
	<aside class="flex min-h-0 flex-col gap-6 overflow-hidden pt-[6vh] pb-4">
		{@render sidebar?.()}
	</aside>
	<section class="flex min-h-0 flex-col gap-4 overflow-y-auto py-4 pr-2">
		<PageHeader {title} {subtitle}>
			{@render actions?.()}
		</PageHeader>
		{@render children()}
	</section>
</div>
