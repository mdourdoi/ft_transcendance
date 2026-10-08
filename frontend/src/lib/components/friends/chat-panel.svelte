<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as NativeSelect from "$lib/components/ui/native-select";
  import { cn } from "$lib/utils";
  import { authFetch } from "$lib/auth";
  import { t } from "$lib/i18n";
  import { sendMessage, onNewMessage, type ChatMessage } from "$lib/socket";
  import { friendManager } from "$lib/stores/friend.svelte";

  let { selectedValue = $bindable("") }: { selectedValue?: string } = $props();

  const selectedId = $derived(selectedValue ? Number(selectedValue) : null);
  const selected = $derived(
    friendManager.friends.find((f) => f.conversationId === selectedId),
  );
  let messages = $state<ChatMessage[]>([]);
  let nextCursor = $state<string | null>(null);
  let hasMore = $state(false);
  let text = $state("");
  let sendError = $state<string | null>(null);

  $effect(() => {
    const id = selectedId;
    messages = [];
    nextCursor = null;
    hasMore = false;
    sendError = null;
    if (id === null) return;

    authFetch(`/api/conversations/${id}/messages?take=20`)
      .then((res) => res.json())
      .then((page) => {
        if (id !== selectedId) return;
        messages = page.items;
        nextCursor = page.nextCursor;
        hasMore = page.hasMore;
      })
      .catch(() => {});
  });

  $effect(() =>
    onNewMessage((msg) => {
      if (msg.conversationId !== undefined && msg.conversationId !== selectedId)
        return;
      if (messages.some((m) => m.id === msg.id)) return;
      messages = [...messages, msg];
    }),
  );

  async function loadMore() {
    const id = selectedId;
    if (id === null || !hasMore || !nextCursor) return;
    const res = await authFetch(
      `/api/conversations/${id}/messages?take=20&cursor=${nextCursor}`,
    );
    const page = await res.json();
    if (id !== selectedId) return;
    messages = [...page.items, ...messages];
    nextCursor = page.nextCursor;
    hasMore = page.hasMore;
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (selectedId === null || !text.trim()) return;
    const res = await sendMessage(selectedId, text);
    if (res.ok) {
      text = "";
      sendError = null;
    } else {
      sendError = res.error;
    }
  }
</script>

<div class="flex flex-col gap-2">
  <Label for="conversation_contact">{$t("FRIENDS.CHOOSE_FRIEND")}</Label>
  <NativeSelect.Root
    id="conversation_contact"
    bind:value={selectedValue}
    class="w-full"
  >
    <NativeSelect.Option value="" disabled
      >{$t("FRIENDS.CHOOSE_CONTACT")}</NativeSelect.Option
    >
    {#each friendManager.friends as f (f.conversationId)}
      <NativeSelect.Option value={String(f.conversationId)}
        >{f.user.username}</NativeSelect.Option
      >
    {/each}
  </NativeSelect.Root>
</div>
{#if selected}
  <div class="flex items-center justify-between">
    <h3 class="font-display text-lg">{selected.user.username}</h3>
    <Button variant="outline" size="sm">{$t("FRIENDS.REFRESH")}</Button>
  </div>
  <div
    class="flex max-h-80 min-h-40 flex-col gap-2 overflow-y-auto rounded-md border border-border bg-muted/40 p-3"
    aria-label="Historique des messages"
    aria-live="polite"
  >
    {#if hasMore}
      <Button variant="outline" size="sm" onclick={loadMore}
        >{$t("COMMON.LOAD_MORE")}</Button
      >
    {/if}
    {#each messages as m (m.id)}
      <div
        class={cn(
          "max-w-[85%] rounded-md px-2 py-1 text-sm",
          m.sender.username === friendManager.username
            ? "self-end bg-primary text-primary-foreground"
            : "self-start bg-card",
        )}
      >
        <strong class="block text-xs opacity-70">{m.sender.username}</strong>
        {m.content}
      </div>
    {/each}
  </div>
  <form class="flex flex-col gap-2" onsubmit={submit}>
    <Label for="message-text">{$t("FRIENDS.YOUR_MESSAGE")}</Label>
    <Textarea
      id="message-text"
      bind:value={text}
      maxlength={1024}
      rows={3}
      placeholder={$t("FRIENDS.MESSAGE_PLACEHOLDER")}
    />
    <Button type="submit" class="self-end">{$t("FRIENDS.SEND")}</Button>
    {#if sendError}<p class="text-sm text-destructive">
        {$t(`ERRORS.${sendError}`, { default: sendError })}
      </p>{/if}
  </form>
{:else}
  <p class="text-sm text-muted-foreground">
    {$t("FRIENDS.SELECT_FRIEND")}
  </p>
{/if}
