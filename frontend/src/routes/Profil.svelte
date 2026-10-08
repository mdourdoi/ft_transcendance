<script lang="ts">
  import Camera from "@lucide/svelte/icons/camera";
  import Upload from "@lucide/svelte/icons/upload";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Separator } from "$lib/components/ui/separator";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Card from "$lib/components/ui/card";
  import * as Collapsible from "$lib/components/ui/collapsible";
  import * as Dialog from "$lib/components/ui/dialog";
  import { cn } from "$lib/utils";
  import { InkQuote, PageShell } from "$lib/components/onitama";
  import { t } from "$lib/i18n";
  import { onMount } from "svelte";
  import { profilManager } from "../utils/profil.svelte";

  onMount(() => {
    profilManager.get_user();
  });

  let {
    player: playerProp,
  }: {
    player?: { name: string; title: string; quote: string; avatar: string };
  } = $props();

  const player = $derived(
    playerProp ?? {
      name: profilManager.username,
      title: $t("PROFILE.DEFAULT_TITLE"),
      quote: $t("PROFILE.DEFAULT_QUOTE"),
      avatar: "../assets/home/avatar/avatar-kenshii.png",
    },
  );

  let settingsOpen = $state(true);

  const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
  const AVATAR_MAX_SIZE = 2 * 1024 * 1024;

  let uploaderOpen = $state(false);
  let dragging = $state(false);
  let uploading = $state(false);
  let file = $state<File | null>(null);
  let preview = $state("");

  $effect(() => {
    if (!file) {
      preview = "";
      return;
    }
    const url = URL.createObjectURL(file);
    preview = url;
    return () => URL.revokeObjectURL(url);
  });

  function open_uploader() {
    file = null;
    profilManager.error_avatar = "";
    uploaderOpen = true;
  }

  function pick(picked: File | undefined) {
    if (!picked) return;
    file = null;
    if (!AVATAR_TYPES.includes(picked.type)) {
      profilManager.error_avatar = "INVALID_FILE_TYPE";
      return;
    }
    if (picked.size > AVATAR_MAX_SIZE) {
      profilManager.error_avatar = "FILE_TOO_LARGE";
      return;
    }
    profilManager.error_avatar = "";
    file = picked;
  }

  function drop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    pick(e.dataTransfer?.files[0]);
  }

  const avatarSrc = $derived(
    `/api/avatars/${profilManager.avatarUrl ?? "default.png"}`,
  );

  async function change_avatar() {
    if (!file || uploading) return;
    uploading = true;
    await profilManager.change_avatar(file);
    uploading = false;
    if (!profilManager.error_avatar) uploaderOpen = false;
  }

  function translateError(code: string): string {
    return $t(`ERRORS.${code}`, { default: code });
  }
</script>

<PageShell title={$t("PROFILE.TITLE")} subtitle={$t("PROFILE.SUBTITLE")}>
  {#snippet sidebar()}
    <InkQuote class="mt-auto" quote={$t("PROFILE.QUOTE")} author="" stamp />
  {/snippet}

  <Card.Root
    class="shrink-0 bg-card/80 backdrop-blur-sm"
    aria-label={$t("PROFILE.IDENTITY")}
  >
    <Card.Content
      class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-6"
    >
      <div class="flex flex-col items-center gap-2">
        <div class="relative">
          <Avatar.Root
            class="size-24 border-4 border-secondary shadow-[0_0_0_2px_var(--accent)]"
          >
            <Avatar.Image src={avatarSrc} alt={`Avatar de ${player.name}`} />
            <Avatar.Fallback>{player.name.slice(0, 2)}</Avatar.Fallback>
          </Avatar.Root>
          <Button
            type="button"
            size="icon"
            class="absolute -right-1 -bottom-1 rounded-full shadow-md"
            aria-label={$t("PROFILE.CHANGE_AVATAR")}
            onclick={open_uploader}
          >
            <Camera />
          </Button>
        </div>
      </div>

      <div class="flex min-w-0 flex-col gap-1">
        <h2 class="flex items-center gap-1 font-display text-3xl font-bold">
          {player.name}
        </h2>
        <span class="flex items-center gap-1 text-sm font-semibold">
          {player.title}
        </span>
        <Separator class="my-2 w-24 bg-primary" />
        <q class="text-sm text-muted-foreground italic">{player.quote}</q>
      </div>
    </Card.Content>
  </Card.Root>

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

<Dialog.Root bind:open={uploaderOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title class="font-display text-xl"
        >{$t("PROFILE.CHANGE_AVATAR")}</Dialog.Title
      >
      <Dialog.Description>{$t("PROFILE.AVATAR_HINT")}</Dialog.Description>
    </Dialog.Header>
    <label
      class={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary hover:bg-muted/60 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        dragging && "border-primary bg-muted/60",
      )}
      ondragover={(e) => {
        e.preventDefault();
        dragging = true;
      }}
      ondragleave={() => (dragging = false)}
      ondrop={drop}
    >
      <input
        type="file"
        class="sr-only"
        accept={AVATAR_TYPES.join(",")}
        onchange={(e) => {
          pick(e.currentTarget.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
      {#if file}
        <img
          src={preview}
          alt=""
          class="size-24 rounded-full border-4 border-secondary object-cover"
        />
        <span class="max-w-full truncate text-sm font-semibold"
          >{file.name}</span
        >
      {:else}
        <Upload class="size-8 text-muted-foreground" />
      {/if}
      <span class="text-sm text-muted-foreground"
        >{$t("PROFILE.AVATAR_DROP")}</span
      >
    </label>
    {#if profilManager.error_avatar}
      <p role="alert" class="text-sm text-destructive">
        {translateError(profilManager.error_avatar)}
      </p>
    {/if}
    <Dialog.Footer>
      <Button
        type="button"
        variant="outline"
        onclick={() => (uploaderOpen = false)}>{$t("COMMON.CANCEL")}</Button
      >
      <Button
        type="button"
        disabled={!file || uploading}
        onclick={change_avatar}>{$t("PROFILE.UPLOAD_AVATAR")}</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
