<script lang="ts">
  import { navigate } from "$lib/router";
  import { Button } from "$lib/components/ui/button";
  import { t } from "$lib/i18n";

  const sections = ["SERVICE", "ACCOUNT", "CONDUCT", "TERMINATION", "LIABILITY"];
</script>

<main class="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6 py-16">
  <h1 class="text-3xl font-bold tracking-tight">{$t("TERMS.TITLE")}</h1>
  <p class="text-muted-foreground text-sm">{$t("LEGAL.UPDATED")}</p>
  {#each sections as section (section)}
    <section class="flex flex-col gap-2">
      <h2 class="text-xl font-semibold">{$t(`TERMS.${section}_TITLE`)}</h2>
      <p>{$t(`TERMS.${section}_BODY`)}</p>
    </section>
  {/each}
  <div class="flex gap-2">
    <Button variant="outline" onclick={() => navigate("/", { useAnimation: true })}>
      {$t("NOTFOUND.HOME")}
    </Button>
  </div>
</main>
