<script lang="ts">
	import { onMount } from "svelte";
	import { Skeleton } from "$lib/components/ui/skeleton";
	import { StandalonePage, Stamp } from "$lib/components/onitama";
	import { api } from "$lib/api";
	import { token } from "$lib/auth";
	import { t } from "$lib/i18n";

	let outcome = $state<"pending" | "done" | "invalid">("pending");

	onMount(async () => {
		const emailToken = new URLSearchParams(window.location.search).get("token");
		if (!emailToken) {
			outcome = "invalid";
			return;
		}
		try {
			const res = await api("/users/delete-confirm", {
				method: "POST",
				body: JSON.stringify({ token: emailToken }),
			});
			outcome = res.ok ? "done" : "invalid";
			if (res.ok) token.set(null);
		} catch {
			outcome = "invalid";
		}
	});
</script>

<StandalonePage title={$t("ACCOUNT_DELETE.TITLE")}>
	{#if outcome === "pending"}
		<Skeleton class="h-5 w-2/3" />
	{:else if outcome === "done"}
		<div class="flex items-center gap-3">
			<Stamp kanji="終" class="size-9 shrink-0 text-lg" />
			<p role="status" class="text-sm">{$t("ACCOUNT_DELETE.DONE")}</p>
		</div>
	{:else}
		<p role="alert" class="text-sm text-destructive">{$t("ACCOUNT_DELETE.INVALID")}</p>
	{/if}
</StandalonePage>
