<script lang="ts">
	import strace from '../../../../assets/Icone/strace.webp';
	import { t } from '$lib/i18n';

	let { lineClass, textClass }: { lineClass: string; textClass: string } = $props();
</script>

<img
	src={strace}
	alt="logo"
	class="absolute left-[calc(50%-130px)] -translate-x-1/2 w-[150px] h-[10px] -scale-x-100 {lineClass}"
/>
<p class="absolute left-[calc(50%-100px)] w-[200px] text-center text-black text-lg font-semibold {textClass}">
	{$t('AUTH.OR')}
</p>
<img
	src={strace}
	alt="logo"
	class="absolute left-[calc(50%+125px)] -translate-x-1/2 w-[150px] h-[10px] {lineClass}"
/>
