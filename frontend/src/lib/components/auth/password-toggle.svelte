<script lang="ts">
	import hide from '../../../../assets/Icone/hide.png';
	import show from '../../../../assets/Icone/not_hide.png';

	let {
		hidden = $bindable(true),
		class: className = '',
		ontoggle,
	}: { hidden?: boolean; class?: string; ontoggle?: () => void } = $props();

	function toggle() {
		hidden = !hidden;
		ontoggle?.();
	}
</script>

<button
	type="button"
	class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100 left-[390px] {className}"
	style="background: transparent !important; box-shadow: none !important;"
	onclick={toggle}
>
	<img src={hidden ? show : hide} alt="description" class="w-[40px] h-[40px] object-contain" />
</button>
