<script lang="ts">
  import { api } from "$lib/api";
  import { token } from "$lib/auth";
  import { navigate } from "$lib/router";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { t } from "$lib/i18n";

  type Step = "ASK" | "DONE" | "INVALID" | "ERROR";

  const linkToken = new URLSearchParams(window.location.search).get("token");

  let step = $state<Step>(linkToken ? "ASK" : "INVALID");
  let busy = $state(false);

  async function confirm() {
    busy = true;
    try {
      const res = await api("/users/delete-confirm", {
        method: "POST",
        body: JSON.stringify({ token: linkToken }),
      });
      if (res.ok) {
        token.set(null);
        step = "DONE";
      } else {
        step = res.status === 400 ? "INVALID" : "ERROR";
      }
    } catch {
      step = "ERROR";
    } finally {
      busy = false;
    }
  }
</script>

<main class="flex min-h-screen items-center justify-center p-6">
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <Card.Title>{$t("ACCOUNT_DELETE.TITLE")}</Card.Title>
    </Card.Header>
    <Card.Content class="flex flex-col gap-3">
      {#if step === "ASK" || step === "ERROR"}
        <p class="text-destructive text-sm">{$t("PRIVACY.DELETE_WARNING")}</p>
        {#if step === "ERROR"}
          <p role="status" class="text-destructive text-sm">{$t("PRIVACY.STATUS_ERROR")}</p>
        {/if}
        <Button variant="destructive" class="w-full" disabled={busy} onclick={confirm}>
          {$t("PRIVACY.DELETE_CONFIRM")}
        </Button>
      {:else}
        <p role="status">{$t(`ACCOUNT_DELETE.${step}`)}</p>
      {/if}
    </Card.Content>
    <Card.Footer>
      <Button variant="outline" onclick={() => navigate("/", { replace: true })}>
        {$t("NOTFOUND.HOME")}
      </Button>
    </Card.Footer>
  </Card.Root>
</main>
