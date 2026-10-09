<script lang="ts">
	import type { Snippet } from 'svelte';
	import cadre from '../../../../assets/bouton_outline.webp';

	let {
		type = 'button',
		class: className = '',
		onclick,
		children,
	}: { type?: 'button' | 'submit'; class?: string; onclick?: () => void; children: Snippet } = $props();
</script>

<button
	{type}
	class="group absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100 left-[calc(50%-175px)] relative w-[340px] h-[60px] flex items-center justify-center {className}"
	style="background: transparent !important; box-shadow: none !important;"
	{onclick}
>
	<img src={cadre} alt="" class="absolute inset-0 w-full h-full object-contain" />
	<span class="relative z-10 text-black text-base font-semibold group-hover:text-white transition-colors">
		{@render children()}
	</span>
</button>
