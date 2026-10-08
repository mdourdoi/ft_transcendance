<script lang="ts">
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import * as Collapsible from "$lib/components/ui/collapsible";
  import { InkQuote, PageShell } from "$lib/components/onitama";
  import { AccountSettings, IdentityCard, TwoFactorSettings } from "$lib/components/profile";
  import { t } from "$lib/i18n";
  import { onMount } from "svelte";
  import { profilManager } from "$lib/stores/profil.svelte";

  onMount(() => {
    profilManager.get_user();
  });

  let settingsOpen = $state(true);
</script>

<PageShell title={$t("PROFILE.TITLE")} subtitle={$t("PROFILE.SUBTITLE")}>
  {#snippet sidebar()}
    <InkQuote class="mt-auto" quote={$t("PROFILE.QUOTE")} author="" stamp />
  {/snippet}

  <IdentityCard />

  <Collapsible.Root bind:open={settingsOpen} class="shrink-0">
    <Card.Root
      class="bg-card/80 backdrop-blur-sm"
      aria-label={$t("PROFILE.SETTINGS.HEADING")}
    >
      <Card.Header class="flex items-center gap-3">
        <Collapsible.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon-sm"
              aria-label={$t("PROFILE.SETTINGS.HEADING")}
              class="[&>svg]:transition-transform data-[state=open]:[&>svg]:rotate-180"
            >
              <ChevronDown />
            </Button>
          {/snippet}
        </Collapsible.Trigger>
        <div class="flex flex-col gap-1">
          <Card.Title class="font-display text-lg"
            >{$t("PROFILE.SETTINGS.HEADING")}</Card.Title
          >
          <Card.Description
            >{$t("PROFILE.SETTINGS.DESCRIPTION")}</Card.Description
          >
        </div>
      </Card.Header>
      <Collapsible.Content class="flex flex-col gap-(--card-spacing)">
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
      </Collapsible.Content>
    </Card.Root>
  </Collapsible.Root>
</PageShell>
