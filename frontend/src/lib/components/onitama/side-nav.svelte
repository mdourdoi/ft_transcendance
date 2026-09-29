<script lang="ts">
	import * as Tabs from "$lib/components/ui/tabs";
	import { cn } from "$lib/utils.js";

	let {
		items,
		label,
		class: className,
	}: { items: { value: string; label: string }[]; label: string; class?: string } = $props();
</script>

<Tabs.List
	aria-label={label}
	class={cn("h-auto w-full flex-col items-stretch gap-1 bg-transparent p-0", className)}
>
	{#each items as item (item.value)}
		<Tabs.Trigger
			value={item.value}
			class="h-auto justify-start rounded-md px-3 py-2 text-base text-foreground/75 transition-transform hover:translate-x-1 hover:text-foreground data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm"
		>
			{item.label}
		</Tabs.Trigger>
	{/each}
</Tabs.List>
