<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Separator } from "$lib/components/ui/separator";
  import { t } from "$lib/i18n";
  import { navigate } from "$lib/router";
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
  <div class="flex flex-col gap-2">
    <span class="text-sm font-semibold">{$t("EMAIL_VERIFY.LABEL")}</span>
    <p class="text-sm text-muted-foreground">{profilManager.email}</p>
    {#if profilManager.email_verified}
      <p class="text-sm font-medium text-emerald-600">
        ✓ {$t("EMAIL_VERIFY.VERIFIED")}
      </p>
    {:else}
      <p class="text-sm text-muted-foreground">{$t("EMAIL_VERIFY.HINT")}</p>
      <Button
        variant="secondary"
        class="self-start"
        onclick={() => profilManager.request_email_verification()}
        >{$t("EMAIL_VERIFY.SEND")}</Button
      >
      {#if profilManager.email_status}
        <p role="status" class="text-sm font-medium text-emerald-600">
          {$t(`EMAIL_VERIFY.${profilManager.email_status}`)}
        </p>
      {/if}
      {#if profilManager.error_email}
        <p role="alert" class="text-sm text-destructive">
          {translateError(profilManager.error_email)}
        </p>
      {/if}
    {/if}
  </div>
  <Separator />
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
      {#if profilManager.username_updated}
        <p role="status" class="text-sm font-medium text-emerald-600">
          ✓ {$t("PROFILE.SETTINGS.USERNAME_UPDATED")}
        </p>
      {/if}
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
        minlength={8}
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
        minlength={8}
        maxlength={128}
        required
        class="bg-card"
        bind:value={profilManager.newpassword2}
      />
      {#if profilManager.is_2fa_enabled}
        <Label for="password-twofa-code"
          >{$t("PROFILE.SETTINGS.TWOFA.CODE")}</Label
        >
        <Input
          id="password-twofa-code"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern={"[0-9]{6}"}
          maxlength={6}
          required
          class="bg-card"
          bind:value={profilManager.password_code}
        />
      {/if}
      <Button type="submit" variant="secondary" class="self-start"
        >{$t("PROFILE.SETTINGS.CHANGE_PASSWORD")}</Button
      >
      {#if profilManager.password_updated}
        <p role="status" class="text-sm font-medium text-emerald-600">
          ✓ {$t("PROFILE.SETTINGS.PASSWORD_UPDATED")}
        </p>
      {/if}
      {#if profilManager.error_password}
        <p role="alert" class="text-sm text-destructive">
          {translateError(profilManager.error_password)}
        </p>
      {/if}
    </fieldset>
  </form>
  <Separator />
  <Button
    variant="outline"
    class="self-start"
    onclick={() => navigate("/privacy", { useAnimation: true })}
    >{$t("PRIVACY.TITLE")}</Button
  >
</section>
