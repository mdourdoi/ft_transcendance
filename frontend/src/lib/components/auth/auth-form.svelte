<script lang="ts">
	import type { Snippet } from 'svelte';
	import frame from '../../../../assets/frame.webp';
	import strace from '../../../../assets/Icone/strace.webp';
	import { t } from '$lib/i18n';

	let { title, onsubmit, children }: { title: string; onsubmit: () => void; children: Snippet } = $props();

	function submit(event: SubmitEvent) {
		event.preventDefault();
		onsubmit();
	}
</script>

<form novalidate onsubmit={submit} class="absolute top-[500px] left-1/2 -translate-x-1/2 w-[550px] h-[600px]">
	<img src={frame} alt="frame" class="absolute inset-0 w-full h-full" />
	<div class="absolute inset-0 flex justify-center top-[75px] text-black" style="font-size: 40px;">
		<p>{title}</p>
	</div>
	<div class="absolute inset-0 flex justify-center top-[130px] text-black" style="font-size: 15px;">
		<p>{$t('AUTH.SUBTITLE')}</p>
	</div>
	{@render children()}
	<img
		src={strace}
		alt="logo"
		class="absolute top-[660px] left-[calc(50%-110px)] -translate-x-1/2 w-[90px] h-auto -scale-x-100"
	/>
	<p class="absolute top-[650px] left-[calc(50%-100px)] w-[200px] text-center text-black text-lg font-semibold">
		onitama
	</p>
	<img
		src={strace}
		alt="logo"
		class="absolute top-[660px] left-[calc(50%+120px)] -translate-x-1/2 w-[90px] h-auto"
	/>
</form>
