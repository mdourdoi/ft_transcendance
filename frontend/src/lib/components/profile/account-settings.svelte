<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Separator } from "$lib/components/ui/separator";
  import { t } from "$lib/i18n";
  import { profilManager } from "$lib/stores/profil.svelte";

  function translateError(code: string): string {
    return $t(`ERRORS.${code}`, { default: code });
  }
</script>

<section
  class="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4"
  aria-labelledby="account-heading"
>
  <h3 id="account-heading" class="font-display text-lg">
    {$t("PROFILE.SETTINGS.ACCOUNT")}
  </h3>
  <form
    class="flex flex-col gap-2"
    onsubmit={(e) => profilManager.change_username(e)}
  >
    <fieldset class="flex flex-col gap-2">
      <legend class="mb-2 text-sm font-semibold"
        >{$t("PROFILE.SETTINGS.NICKNAME")}</legend
      >
      <Label for="profile-username"
        >{$t("PROFILE.SETTINGS.USERNAME")}</Label
      >
      <Input
        id="profile-username"
        autocomplete="username"
        minlength={3}
        maxlength={24}
        pattern="[a-zA-Z0-9]+"
        required
        class="bg-card"
        bind:value={profilManager.newusername}
      />
      <Button type="submit" variant="secondary" class="self-start"
        >{$t("PROFILE.SETTINGS.SAVE_USERNAME")}</Button
      >
      {#if profilManager.error_username}
        <p role="alert" class="text-sm text-destructive">
          {translateError(profilManager.error_username)}
        </p>
      {/if}
    </fieldset>
  </form>
  <Separator />
  <form
    class="flex flex-col gap-2"
    onsubmit={(e) => profilManager.change_password(e)}
  >
    <fieldset class="flex flex-col gap-2">
      <legend class="mb-2 text-sm font-semibold"
        >{$t("PROFILE.SETTINGS.PASSWORD")}</legend
      >
      <Label for="current-password"
        >{$t("PROFILE.SETTINGS.CURRENT_PASSWORD")}</Label
      >
      <Input
        id="current-password"
        type="password"
        autocomplete="current-password"
        required
        class="bg-card"
        bind:value={profilManager.oldpassword}
      />
      <Label for="new-password"
        >{$t("PROFILE.SETTINGS.NEW_PASSWORD")}</Label
      >
      <Input
        id="new-password"
        type="password"
        autocomplete="new-password"
        minlength={12}
        maxlength={128}
        required
        aria-describedby="password-hint"
        class="bg-card"
        bind:value={profilManager.newpassword1}
      />
      <small id="password-hint" class="text-xs text-muted-foreground"
        >{$t("PROFILE.SETTINGS.PASSWORD_HINT")}</small
      >
      <Label for="confirm-password"
        >{$t("PROFILE.SETTINGS.CONFIRM_PASSWORD")}</Label
      >
      <Input
        id="confirm-password"
        type="password"
        autocomplete="new-password"
        minlength={12}
        maxlength={128}
        required
        class="bg-card"
        bind:value={profilManager.newpassword2}
      />
      <Button type="submit" variant="secondary" class="self-start"
        >{$t("PROFILE.SETTINGS.CHANGE_PASSWORD")}</Button
      >
      {#if profilManager.error_password}
        <p role="alert" class="text-sm text-destructive">
          {translateError(profilManager.error_password)}
        </p>
      {/if}
    </fieldset>
  </form>
</section>
