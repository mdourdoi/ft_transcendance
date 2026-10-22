<script lang="ts">
	import type { Snippet } from 'svelte';
	import frame from '../../../../assets/button_outline.webp';

	let {
		value = $bindable(''),
		type = 'text',
		placeholder,
		icon,
		class: className = '',
		iconClass = '',
		children,
	}: {
		value?: string;
		type?: string;
		placeholder: string;
		icon: string;
		class?: string;
		iconClass?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="relative w-[340px] h-[60px] left-[100px] {className}">
	<img src={frame} alt="" class="absolute inset-0 w-full h-full" />
	<input
		{type}
		bind:value
		{placeholder}
		class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black"
	/>
</div>
<div>
	<img src={icon} alt="" class="absolute left-[110px] {iconClass}" />
	{@render children?.()}
</div>
