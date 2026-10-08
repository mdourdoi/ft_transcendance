<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { t } from "$lib/i18n";
  import { profilManager } from "$lib/stores/profil.svelte";

  function translateError(code: string): string {
    return $t(`ERRORS.${code}`, { default: code });
  }
</script>

<div class="flex flex-col gap-4">
  {#if profilManager.qr_image !== "" && !profilManager.is_2fa_enabled}
    <section
      class="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4"
      aria-labelledby="security-heading"
    >
      <h3 id="security-heading" class="font-display text-lg">
        {$t("PROFILE.SETTINGS.TWOFA.HEADING")}
      </h3>
      <p class="text-sm text-muted-foreground">
        {$t("PROFILE.SETTINGS.TWOFA.SCAN")}
      </p>
      <div
        class="flex justify-center p-2 bg-white rounded-md w-fit self-center"
      >
        <img
          src={profilManager.qr_image}
          alt={$t("PROFILE.SETTINGS.TWOFA.QR_ALT")}
          class="size-48"
        />
      </div>
      <form
        class="flex flex-col gap-2"
        onsubmit={(e) => profilManager.validat_two_fa(e)}
      >
        <Label for="two-fa-code"
          >{$t("PROFILE.SETTINGS.TWOFA.CODE")}</Label
        >
        <Input
          id="two-fa-code"
          type="text"
          class="bg-card"
          bind:value={profilManager.qr_code}
        />
        <Button
          type="submit"
          variant="secondary"
          class="self-start mt-2"
          >{$t("PROFILE.SETTINGS.TWOFA.VALIDATE")}</Button
        >
        {#if profilManager.two_fa}
          <p class="text-sm text-destructive">
            {translateError(profilManager.two_fa)}
          </p>
        {/if}
      </form>
    </section>
  {:else if !profilManager.is_2fa_enabled}
    <section
      class="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4"
      aria-labelledby="security-heading"
    >
      <h3 id="security-heading" class="font-display text-lg">
        {$t("PROFILE.SETTINGS.TWOFA.HEADING")}
      </h3>
      <p class="text-sm text-muted-foreground">
        {$t("PROFILE.SETTINGS.TWOFA.PROTECT")}
      </p>
      <Button
        type="button"
        class="text-sm self-start"
        onclick={() => profilManager.active_two_fa()}
        >{$t("PROFILE.SETTINGS.TWOFA.ENABLE")}</Button
      >
      {#if profilManager.two_fa}
        <p class="text-sm text-destructive">
          {translateError(profilManager.two_fa)}
        </p>
      {/if}
    </section>
  {:else}
    <section
      class="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4"
      aria-labelledby="security-heading"
    >
      <h3 id="security-heading" class="font-display text-lg">
        {$t("PROFILE.SETTINGS.TWOFA.HEADING")}
      </h3>
      <p class="text-sm text-emerald-600 font-medium">
        ✓ {$t("PROFILE.SETTINGS.TWOFA.ENABLED")}
      </p>
      <form
        class="flex flex-col gap-2"
        onsubmit={(e) => profilManager.delite_two_fa(e)}
      >
        <Label for="two-fa-code-disable"
          >{$t("PROFILE.SETTINGS.TWOFA.DISABLE_LABEL")}</Label
        >
        <Input
          id="two-fa-code-disable"
          type="text"
          class="bg-card"
          bind:value={profilManager.qr_code}
        />
        <Button
          type="submit"
          variant="destructive"
          class="text-sm self-start mt-1"
        >
          {$t("PROFILE.SETTINGS.TWOFA.DISABLE")}
        </Button>
      </form>
      {#if profilManager.two_fa}
        <p class="text-sm text-destructive">
          {translateError(profilManager.two_fa)}
        </p>
      {/if}
    </section>
  {/if}
</div>
