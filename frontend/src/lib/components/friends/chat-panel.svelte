<script lang="ts">
  import { tick } from "svelte";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import Swords from "@lucide/svelte/icons/swords";
  import X from "@lucide/svelte/icons/x";
  import { Button } from "$lib/components/ui/button";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Card from "$lib/components/ui/card";
  import * as NativeSelect from "$lib/components/ui/native-select";
  import { Stamp } from "$lib/components/onitama";
  import { cn } from "$lib/utils";
  import { authFetch } from "$lib/auth";
  import { t, locale } from "$lib/i18n";
  import { onlineFriends, sendMessage, onNewMessage, type ChatMessage } from "$lib/socket";
  import { friendManager } from "$lib/stores/friend.svelte";
  import { inviteManager } from "$lib/stores/invites.svelte";
  import ChatComposer from "./chat-composer.svelte";
  import ChatInvite from "./chat-invite.svelte";
  import ChatMessageBubble from "./chat-message.svelte";

  let {
    selectedValue = $bindable(""),
    onclose,
  }: { selectedValue?: string; onclose: () => void } = $props();

  const selectedId = $derived(selectedValue ? Number(selectedValue) : null);
  const selected = $derived(
    friendManager.friends.find((f) => f.conversationId === selectedId),
  );
  const online = $derived(!!selected && !!$onlineFriends[selected.user.id]);
  const timeFormat = $derived(
    new Intl.DateTimeFormat($locale ?? undefined, { hour: "2-digit", minute: "2-digit" }),
  );

  let messages = $state<ChatMessage[]>([]);
  let nextCursor = $state<string | null>(null);
  let hasMore = $state(false);
  let text = $state("");
  let sending = $state(false);
  let sendError = $state<string | null>(null);
  let viewport = $state<HTMLDivElement>();
  let atBottom = $state(true);

  async function toBottom(smooth = false) {
    await tick();
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    atBottom = true;
  }

  function track() {
    if (!viewport) return;
    atBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 24;
  }

  $effect(() => {
    const id = selectedId;
    messages = [];
    nextCursor = null;
    hasMore = false;
    sendError = null;
    inviteManager.error = "";
    if (id === null) return;

    authFetch(`/api/conversations/${id}/messages?take=20`)
      .then((res) => res.json())
      .then((page) => {
        if (id !== selectedId) return;
        messages = page.items;
        nextCursor = page.nextCursor;
        hasMore = page.hasMore;
        void toBottom();
      })
      .catch(() => {});
  });

  $effect(() =>
    onNewMessage((msg) => {
      if (msg.conversationId !== undefined && msg.conversationId !== selectedId)
        return;
      if (messages.some((m) => m.id === msg.id)) return;
      const follow = atBottom || msg.sender.username === friendManager.username;
      messages = [...messages, msg];
      if (follow) void toBottom(true);
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
    const before = viewport?.scrollHeight ?? 0;
    messages = [...page.items, ...messages];
    nextCursor = page.nextCursor;
    hasMore = page.hasMore;
    await tick();
    if (viewport) viewport.scrollTop += viewport.scrollHeight - before;
  }

  async function send() {
    if (selectedId === null || !text.trim() || sending) return;
    sending = true;
    const res = await sendMessage(selectedId, text);
    sending = false;
    if (res.ok) {
      text = "";
      sendError = null;
      if (!messages.some((m) => m.id === res.message.id)) messages = [...messages, res.message];
      void toBottom(true);
    } else {
      sendError = res.error;
    }
  }
</script>

<Card.Root class="h-full gap-0 border-2 border-double border-border bg-card/90 py-0 shadow-md">
  <Card.Header class="flex items-center gap-3 border-b border-border py-3">
    {#if selected}
      <Avatar.Root class="size-10 shrink-0">
        <Avatar.Image src={`/api/avatars/${selected.user.avatarUrl ?? "default.png"}`} alt={selected.user.username} />
        <Avatar.Fallback>{selected.user.username.slice(0, 2)}</Avatar.Fallback>
        {#if online}
          <Avatar.Badge class="bg-emerald-500" />
        {/if}
      </Avatar.Root>
    {:else}
      <Stamp kanji="話" class="size-10 shrink-0 text-xl" />
    {/if}
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <NativeSelect.Root
        size="sm"
        aria-label={$t("FRIENDS.CHOOSE_FRIEND")}
        bind:value={selectedValue}
        class="w-full bg-card font-display text-base"
      >
        <NativeSelect.Option value="" disabled>{$t("FRIENDS.CHOOSE_CONTACT")}</NativeSelect.Option>
        {#each friendManager.friends as f (f.conversationId)}
          <NativeSelect.Option value={String(f.conversationId)}>{f.user.username}</NativeSelect.Option>
        {/each}
      </NativeSelect.Root>
      {#if selected}
        <span class={cn("px-1 text-xs", online ? "text-emerald-700" : "text-muted-foreground")}>
          {$t(online ? "FRIENDS.STATUS.ONLINE" : "FRIENDS.STATUS.OFFLINE")}
        </span>
      {/if}
    </div>
    {#if selected}
      <Button
        variant="ghost"
        size="icon-sm"
        class="shrink-0 self-start text-primary"
        aria-label={$t("INVITES.CHALLENGE")}
        title={$t("INVITES.CHALLENGE")}
        disabled={!!inviteManager.outgoing[selected.user.id] || !!inviteManager.incoming[selected.user.id]}
        onclick={() => inviteManager.send(selected.user.id)}
      >
        <Swords />
      </Button>
    {/if}
    <Button variant="ghost" size="icon-sm" class="shrink-0 self-start" aria-label={$t("COMMON.CLOSE")} onclick={onclose}>
      <X />
    </Button>
  </Card.Header>

  <Card.Content class="relative min-h-0 flex-1 p-0">
    {#if !selected}
      <div class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Stamp kanji="友" />
        <p class="text-sm text-muted-foreground italic">{$t("FRIENDS.SELECT_FRIEND")}</p>
      </div>
    {:else}
      <div
        bind:this={viewport}
        onscroll={track}
        role="log"
        aria-relevant="additions"
        aria-live="polite"
        aria-label={$t("FRIENDS.MESSAGING")}
        class="flex h-full flex-col gap-2 overflow-y-auto p-(--card-spacing)"
      >
        {#if hasMore}
          <Button variant="outline" size="sm" class="self-center" onclick={loadMore}>{$t("COMMON.LOAD_MORE")}</Button>
        {/if}
        {#each messages as m (m.id)}
          <ChatMessageBubble
            message={m}
            mine={m.sender.username === friendManager.username}
            time={timeFormat.format(new Date(m.createdAt))}
          />
        {:else}
          <div class="m-auto flex flex-col items-center gap-3 text-center">
            <Stamp kanji="話" />
            <p class="text-sm text-muted-foreground italic">{$t("FRIENDS.CHAT_EMPTY")}</p>
          </div>
        {/each}
      </div>
      {#if !atBottom}
        <Button
          variant="secondary"
          size="icon-sm"
          class="absolute bottom-2 left-1/2 -translate-x-1/2 animate-in rounded-full shadow-md fade-in-0 zoom-in-75"
          aria-label={$t("FRIENDS.SCROLL_BOTTOM")}
          onclick={() => toBottom(true)}
        >
          <ArrowDown />
        </Button>
      {/if}
    {/if}
  </Card.Content>

  <Card.Footer class="flex-col items-stretch gap-2 border-t border-border">
    {#if selected}
      <ChatInvite friend={selected.user} />
    {/if}
    {#if inviteManager.error}
      <p role="alert" class="text-sm text-destructive">
        {$t(`ERRORS.${inviteManager.error}`, { default: $t("ERRORS.UNKNOWN_ERROR") })}
      </p>
    {/if}
    <ChatComposer bind:value={text} disabled={!selected || sending} onsend={send} />
    {#if sendError}
      <p role="alert" class="text-sm text-destructive">
        {$t(`ERRORS.${sendError}`, { default: sendError })}
      </p>
    {/if}
  </Card.Footer>
</Card.Root>
