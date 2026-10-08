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
	class={cn("h-auto w-full flex-col items-stretch gap-2 bg-transparent py-1 pr-4 pl-2", className)}
>
	{#each items as item (item.value)}
		<Tabs.Trigger
			value={item.value}
			class="brush-tab h-auto justify-start rounded-md px-3 py-2 text-base text-secondary-foreground/80 transition-transform hover:translate-x-1 hover:text-secondary-foreground dark:text-secondary-foreground/80 dark:hover:text-secondary-foreground data-active:bg-transparent data-active:text-white data-active:hover:text-white dark:data-active:text-white dark:data-active:hover:text-white dark:data-active:border-transparent dark:data-active:bg-transparent"
		>
			<span class="brush-tab-paper" aria-hidden="true"></span>
			{item.label}
		</Tabs.Trigger>
	{/each}
</Tabs.List>
