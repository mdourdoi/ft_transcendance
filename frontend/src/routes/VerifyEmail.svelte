<script lang="ts">
	import { onMount } from "svelte";
	import { Skeleton } from "$lib/components/ui/skeleton";
	import { StandalonePage, Stamp } from "$lib/components/onitama";
	import { api } from "$lib/api";
	import { t } from "$lib/i18n";

	let outcome = $state<"pending" | "done" | "invalid">("pending");

	onMount(async () => {
		const emailToken = new URLSearchParams(window.location.search).get("token");
		if (!emailToken) {
			outcome = "invalid";
			return;
		}
		try {
			const res = await api("/users/verify-email/confirm", {
				method: "POST",
				body: JSON.stringify({ token: emailToken }),
			});
			outcome = res.ok ? "done" : "invalid";
		} catch {
			outcome = "invalid";
		}
	});
</script>

<StandalonePage title={$t("VERIFY_EMAIL.TITLE")}>
	{#if outcome === "pending"}
		<Skeleton class="h-5 w-2/3" />
	{:else if outcome === "done"}
		<div class="flex items-center gap-3">
			<Stamp kanji="達" class="size-9 shrink-0 text-lg" />
			<p role="status" class="text-sm">{$t("VERIFY_EMAIL.DONE")}</p>
		</div>
	{:else}
		<p role="alert" class="text-sm text-destructive">{$t("VERIFY_EMAIL.INVALID")}</p>
	{/if}
</StandalonePage>
