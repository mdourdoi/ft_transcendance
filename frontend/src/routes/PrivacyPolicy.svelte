<script lang="ts">
	import { StandalonePage } from "$lib/components/onitama";
	import { t } from "$lib/i18n";

	const sections = ["DATA", "PURPOSE", "RETENTION", "RIGHTS", "CONTACT"];
</script>

<StandalonePage title={$t("POLICY.TITLE")}>
	{#each sections as section (section)}
		<section class="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
			<h2 class="font-display text-lg">◒ {$t(`POLICY.${section}_TITLE`)}</h2>
			<p class="text-sm leading-relaxed text-foreground/80">{$t(`POLICY.${section}_BODY`)}</p>
		</section>
	{/each}
	<small class="text-xs text-muted-foreground">{$t("LEGAL.UPDATED")}</small>
</StandalonePage>
