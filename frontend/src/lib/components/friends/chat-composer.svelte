<script lang="ts">
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import * as InputGroup from "$lib/components/ui/input-group";
  import { t } from "$lib/i18n";

  const MAX_LENGTH = 1024;

  let {
    value = $bindable(""),
    disabled = false,
    onsend,
  }: { value?: string; disabled?: boolean; onsend: () => void } = $props();

  const empty = $derived(!value.trim());

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!empty && !disabled) onsend();
  }

  function keys(event: KeyboardEvent) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    if (!empty && !disabled) onsend();
  }
</script>

<form class="w-full" onsubmit={submit}>
  <InputGroup.Root class="h-auto bg-card">
    <InputGroup.Textarea
      bind:value
      rows={2}
      maxlength={MAX_LENGTH}
      {disabled}
      aria-label={$t("FRIENDS.YOUR_MESSAGE")}
      placeholder={$t("FRIENDS.MESSAGE_PLACEHOLDER")}
      class="max-h-32 min-h-14"
      onkeydown={keys}
    />
    <InputGroup.Addon align="block-end" class="pt-1">
      <span class="text-xs text-muted-foreground tabular-nums">{value.length}/{MAX_LENGTH}</span>
      <InputGroup.Button
        type="submit"
        variant="default"
        size="icon-sm"
        class="ml-auto rounded-full"
        disabled={empty || disabled}
        aria-label={$t("FRIENDS.SEND")}
      >
        <ArrowUp />
      </InputGroup.Button>
    </InputGroup.Addon>
  </InputGroup.Root>
</form>
