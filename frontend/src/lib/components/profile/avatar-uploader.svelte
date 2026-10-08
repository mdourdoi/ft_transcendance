<script lang="ts">
  import Camera from "@lucide/svelte/icons/camera";
  import Upload from "@lucide/svelte/icons/upload";
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { cn } from "$lib/utils";
  import { t } from "$lib/i18n";
  import { profilManager } from "$lib/stores/profil.svelte";

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

<Button
  type="button"
  size="icon"
  class="absolute -right-1 -bottom-1 rounded-full shadow-md"
  aria-label={$t("PROFILE.CHANGE_AVATAR")}
  onclick={open_uploader}
>
  <Camera />
</Button>

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
