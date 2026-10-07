<script lang="ts">
	import Download from "@lucide/svelte/icons/download";
	import Trash2 from "@lucide/svelte/icons/trash-2";
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { StandalonePage } from "$lib/components/onitama";
	import { api } from "$lib/api";
	import { token } from "$lib/auth";
	import { cn } from "$lib/utils";
	import { t } from "$lib/i18n";

	type Status = "EXPORTED" | "SENT" | "RATE" | "ERROR";

	let status = $state<Status | null>(null);
	let loading = $state(false);
	let confirmOpen = $state(false);

	function failure(res: Response): Status {
		return res.status === 429 ? "RATE" : "ERROR";
	}

	async function exportData() {
		if (loading) return;
		loading = true;
		status = null;
		try {
			const res = await api("/users/me/export");
			if (!res.ok) {
				status = failure(res);
				return;
			}
			const url = URL.createObjectURL(await res.blob());
			const link = document.createElement("a");
			link.href = url;
			link.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "export.json";
			link.click();
			URL.revokeObjectURL(url);
			status = "EXPORTED";
		} catch {
			status = "ERROR";
		} finally {
			loading = false;
		}
	}

	async function requestDeletion() {
		if (loading) return;
		loading = true;
		status = null;
		try {
			const res = await api("/users/me/delete-request", { method: "POST" });
			status = res.ok ? "SENT" : failure(res);
		} catch {
			status = "ERROR";
		} finally {
			loading = false;
			confirmOpen = false;
		}
	}
</script>

<StandalonePage title={$t("PRIVACY.TITLE")} subtitle={$t("PRIVACY.SUBTITLE")}>
	{#if !$token}
		<p role="alert" class="text-sm text-muted-foreground">{$t("PRIVACY.LOGIN_REQUIRED")}</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<section class="flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
				<Button variant="secondary" disabled={loading} onclick={exportData}>
					<Download />
					{$t("PRIVACY.EXPORT")}
				</Button>
			</section>
			<section class="flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
				<p class="text-sm text-muted-foreground">{$t("PRIVACY.DELETE_WARNING")}</p>
				<Button variant="destructive" disabled={loading} onclick={() => (confirmOpen = true)}>
					<Trash2 />
					{$t("PRIVACY.DELETE")}
				</Button>
			</section>
		</div>

		{#if status}
			{@const failed = status === "RATE" || status === "ERROR"}
			<p
				role={failed ? "alert" : "status"}
				class={cn("text-sm font-medium", failed ? "text-destructive" : "text-emerald-600")}
			>
				{$t(`PRIVACY.STATUS_${status}`)}
			</p>
		{/if}
	{/if}
</StandalonePage>

<Dialog.Root bind:open={confirmOpen}>
	<Dialog.Content class="border-4 border-double border-border">
		<Dialog.Header class="border-b border-border pb-3">
			<Dialog.Title class="font-display text-2xl">{$t("PRIVACY.DELETE")}</Dialog.Title>
			<Dialog.Description>{$t("PRIVACY.DELETE_WARNING")}</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmOpen = false)}>{$t("PRIVACY.CANCEL")}</Button>
			<Button variant="destructive" disabled={loading} onclick={requestDeletion}>
				{$t("PRIVACY.DELETE_CONFIRM")}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
