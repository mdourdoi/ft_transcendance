<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { InkQuote, PageShell } from "$lib/components/onitama";
  import {
    AccountSettings,
    CollapsibleCard,
    IdentityCard,
    StatsPanel,
    TwoFactorSettings,
  } from "$lib/components/profile";
  import { t } from "$lib/i18n";
  import { onMount } from "svelte";
  import { profilManager } from "$lib/stores/profil.svelte";

  onMount(() => {
    profilManager.get_user();
  });
</script>

<PageShell title={$t("PROFILE.TITLE")} subtitle={$t("PROFILE.SUBTITLE")}>
  {#snippet sidebar()}
    <InkQuote class="mt-auto" quote={$t("PROFILE.QUOTE")} author="" stamp />
  {/snippet}

  <IdentityCard />

  <CollapsibleCard title={$t("STATS.TITLE")} description={$t("STATS.SUBTITLE")}>
    <Card.Content class="flex flex-col gap-4">
      <StatsPanel />
    </Card.Content>
  </CollapsibleCard>

  <CollapsibleCard
    title={$t("PROFILE.SETTINGS.HEADING")}
    description={$t("PROFILE.SETTINGS.DESCRIPTION")}
  >
    <Card.Content class="grid grid-cols-2 gap-4">
      <AccountSettings />
      <TwoFactorSettings />
    </Card.Content>
    <Card.Footer
      class="flex items-center justify-between gap-3 border-t border-border"
    >
      <Button variant="outline">{$t("PROFILE.SETTINGS.RESET")}</Button>
      <small class="text-xs text-muted-foreground"
        >{$t("PROFILE.SETTINGS.RESET_HINT")}</small
      >
    </Card.Footer>
  </CollapsibleCard>
</PageShell>
