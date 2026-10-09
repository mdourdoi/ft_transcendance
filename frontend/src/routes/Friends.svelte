<script lang="ts">
  import Search from "@lucide/svelte/icons/search";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import * as Sheet from "$lib/components/ui/sheet";
  import * as ContextMenu from "$lib/components/ui/context-menu";
  import {
    AddFriendForm,
    ChatPanel,
    FriendRequestRow,
    FriendRow,
    FriendsFooter,
    FriendsProfile,
    FriendsSection,
  } from "$lib/components/friends";
  import { friendManager } from "$lib/stores/friend.svelte";
  import { inviteManager } from "$lib/stores/invites.svelte";
  import { logout } from "$lib/auth";
  import { cn } from "$lib/utils";
  import { t } from "$lib/i18n";
  import { onlineFriends } from "$lib/socket";

  const sortedFriends = $derived(
    [...friendManager.friends].sort(
      (a, b) =>
        Number(!!$onlineFriends[b.user.id]) -
        Number(!!$onlineFriends[a.user.id]),
    ),
  );

  const online = $derived({
    label: $t("FRIENDS.STATUS.ONLINE"),
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  });

  let adding = $state(false);
  let chatting = $state(false);
  const announced: Record<number, number> = {};

  $effect(() => {
    for (const invite of Object.values(inviteManager.incoming)) {
      if (announced[invite.from.id] === invite.expiresAt) continue;
      announced[invite.from.id] = invite.expiresAt;
      const friend = friendManager.friends.find((f) => f.user?.id === invite.from.id);
      if (!friend) continue;
      selectedValue = String(friend.conversationId);
      chatting = true;
    }
  });
  let selectedValue = $state("");
</script>

<aside
  class={cn(
    "grid h-full overflow-hidden px-[5px] pt-[5px]",
    chatting
      ? "grid-rows-[15.5vh_minmax(0,2fr)_minmax(0,3fr)_auto]"
      : "grid-rows-[15.5vh_minmax(0,1fr)_auto]",
  )}
>
  <FriendsProfile username={friendManager.username} avatar={friendManager.avatar} />

  <section class="flex min-h-0 flex-col gap-3 p-2">
    <div class="relative">
      <Input
        type="text"
        placeholder={$t("FRIENDS.SEARCH_PLACEHOLDER")}
        class="h-10 bg-card/70 pr-10"
      />
      <Button
        variant="ghost"
        size="icon"
        class="absolute top-1/2 right-1 -translate-y-1/2"
        aria-label={$t("FRIENDS.SEARCH")}
      >
        <Search />
      </Button>
    </div>

    <ScrollArea class="min-h-0 flex-1 pr-2">
      <div class="flex flex-col gap-3">
        {#if friendManager.error}
          <p
            role="alert"
            class="text-center text-sm font-semibold text-destructive"
          >
            {$t(`ERRORS.${friendManager.error}`, {
              default: $t("ERRORS.UNKNOWN_ERROR"),
            })}
          </p>
        {/if}

        <FriendsSection
          label="DEMANDES"
          count={friendManager.friend_requests.length}
          empty="Aucune demande en attente"
          class="pl-2 pt-1"
        >
          {#each friendManager.friend_requests as req (req.user.id)}
            <FriendRequestRow
              user={req.user}
              onaccept={() => friendManager.accept_request(req.user.id)}
              ondeny={() => friendManager.deny_request(req.user.id)}
            />
          {/each}
        </FriendsSection>

        <FriendsSection
          label="AMIS"
          count={friendManager.friends.length}
          empty="Aucun ami pour le moment"
        >
          {#each sortedFriends as f (f.user.id)}
            <FriendRow
              user={f.user}
              status={$onlineFriends[f.user.id] ? online : null}
              class="group"
            >
              <ContextMenu.Item
                onclick={() => {
                  selectedValue = String(f.conversationId);
                  chatting = true;
                }}
              >
                Envoyer un message
              </ContextMenu.Item>
              <ContextMenu.Separator />
              <ContextMenu.Item
                class="text-destructive"
                onclick={() => friendManager.block_friend(f.user.id)}
              >
                Bloquer
              </ContextMenu.Item>
              <ContextMenu.Item
                class="text-destructive"
                onclick={() => friendManager.remove_friend(f.user.id)}
              >
                Retirer des amis
              </ContextMenu.Item>
            </FriendRow>
          {/each}
        </FriendsSection>

        <FriendsSection
          label="BLOQUÉS"
          count={friendManager.blocked.length}
          empty="Aucun utilisateur bloqué"
        >
          {#each friendManager.blocked as f (f.user.id)}
            <FriendRow user={f.user}>
              <ContextMenu.Item
                onclick={() => friendManager.unblock_friend(f.user.id)}
              >
                Débloquer
              </ContextMenu.Item>
            </FriendRow>
          {/each}
        </FriendsSection>

        <FriendsSection
          label="INVITATIONS ENVOYÉES"
          count={friendManager.sent.length}
          empty="Aucune invitation envoyée"
        >
          {#each friendManager.sent as f (f.user.id)}
            <FriendRow user={f.user}>
              <ContextMenu.Item
                class="text-destructive"
                onclick={() => friendManager.cancel_invitation(f.user.id)}
              >
                Annuler l'invitation
              </ContextMenu.Item>
            </FriendRow>
          {/each}
        </FriendsSection>
      </div>
    </ScrollArea>
  </section>

  {#if chatting}
    <div class="min-h-0 animate-in px-2 pb-2 duration-300 fade-in-0 slide-in-from-bottom-6">
      <ChatPanel bind:selectedValue onclose={() => (chatting = false)} />
    </div>
  {/if}

  <FriendsFooter
    onmessages={() => (chatting = !chatting)}
    onadd={() => (adding = true)}
    onlogout={logout}
  />
</aside>

<Sheet.Root
  open={adding}
  onOpenChange={(open) => {
    if (!open) {
      adding = false;
      friendManager.error = "";
    }
  }}
>
  <Sheet.Content
    side="right"
    class="gap-0 border-l-4 border-double border-border"
  >
    <Sheet.Header class="border-b border-border">
      <span class="text-[10px] tracking-[0.3em] text-muted-foreground"
        >{$t("COMMON.EYEBROW")}</span
      >
      <Sheet.Title class="font-display text-2xl">
        {$t("FRIENDS.ADD_CONTACT")}
      </Sheet.Title>
    </Sheet.Header>

    <div class="flex flex-col gap-4 p-4">
      <AddFriendForm />
    </div>
  </Sheet.Content>
</Sheet.Root>
