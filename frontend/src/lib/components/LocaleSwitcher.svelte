<script lang="ts">
  import { locale, t, SUPPORTED_LOCALES } from "$lib/i18n";
  import { Button } from "$lib/components/ui/button";
</script>

<div class="flex gap-1" role="group" aria-label={$t("LANGUAGE.LABEL")}>
  {#each SUPPORTED_LOCALES as code (code)}
    <Button
      variant={$locale === code ? "secondary" : "ghost"}
      size="xs"
      aria-pressed={$locale === code}
      onclick={() => locale.set(code)}
    >
      {code.toUpperCase()}
    </Button>
  {/each}
</div>
