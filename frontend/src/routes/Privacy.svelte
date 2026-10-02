<script lang="ts">
  import { api } from "$lib/api";
  import { token } from "$lib/auth";
  import { navigate } from "$lib/router";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { t } from "$lib/i18n";

  type Status = "EXPORTED" | "SENT" | "RATE" | "ERROR";

  let status = $state<Status | null>(null);
  let confirming = $state(false);
  let busy = $state(false);

  function filename(res: Response) {
    return res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "my-data.json";
  }

  async function exportData() {
    busy = true;
    status = null;
    try {
      const res = await api("/users/me/export");
      if (!res.ok) {
        status = "ERROR";
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = filename(res);
      a.click();
      URL.revokeObjectURL(url);
      status = "EXPORTED";
    } catch {
      status = "ERROR";
    } finally {
      busy = false;
    }
  }

  async function requestDeletion() {
    busy = true;
    status = null;
    try {
      const res = await api("/users/me/delete-request", { method: "POST" });
      status = res.ok ? "SENT" : res.status === 429 ? "RATE" : "ERROR";
    } catch {
      status = "ERROR";
    } finally {
      busy = false;
      confirming = false;
    }
  }
</script>

<main class="flex min-h-screen items-center justify-center p-6">
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <Card.Title>{$t("PRIVACY.TITLE")}</Card.Title>
      <Card.Description>{$t("PRIVACY.SUBTITLE")}</Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-3">
      {#if !$token}
        <p class="text-muted-foreground">{$t("PRIVACY.LOGIN_REQUIRED")}</p>
      {:else}
        <Button class="w-full" disabled={busy} onclick={exportData}>{$t("PRIVACY.EXPORT")}</Button>

        {#if confirming}
          <div role="alertdialog" aria-labelledby="delete-warning" class="flex flex-col gap-3">
            <p id="delete-warning" class="text-destructive text-sm">{$t("PRIVACY.DELETE_WARNING")}</p>
            <Button variant="destructive" class="w-full" disabled={busy} onclick={requestDeletion}>
              {$t("PRIVACY.DELETE_CONFIRM")}
            </Button>
            <Button variant="outline" class="w-full" disabled={busy} onclick={() => (confirming = false)}>
              {$t("PRIVACY.CANCEL")}
            </Button>
          </div>
        {:else}
          <Button variant="destructive" class="w-full" disabled={busy} onclick={() => (confirming = true)}>
            {$t("PRIVACY.DELETE")}
          </Button>
        {/if}

        {#if status}
          <p role="status" class={status === "RATE" || status === "ERROR" ? "text-destructive text-sm" : "text-sm"}>
            {$t(`PRIVACY.STATUS_${status}`)}
          </p>
        {/if}
      {/if}
    </Card.Content>
    <Card.Footer>
      <Button variant="outline" onclick={() => navigate("/", { useAnimation: true })}>
        {$t("NOTFOUND.HOME")}
      </Button>
    </Card.Footer>
  </Card.Root>
</main>
