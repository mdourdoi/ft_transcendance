<script lang="ts">
  import Search from "@lucide/svelte/icons/search";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import * as Sheet from "$lib/components/ui/sheet";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
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
  import { logout } from "$lib/auth";
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

  let popup: "" | "message" | "add" = $state("");
  let selectedValue = $state("");
</script>

<aside
  class="grid h-full grid-rows-[15.5vh_minmax(0,1fr)_auto] overflow-hidden px-[5px] pt-[5px]"
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
              <DropdownMenu.Item
                onclick={() => {
                  selectedValue = String(f.conversationId);
                  popup = "message";
                }}
              >
                Envoyer un message
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                class="text-destructive"
                onclick={() => friendManager.block_friend(f.user.id)}
              >
                Bloquer
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="text-destructive"
                onclick={() => friendManager.remove_friend(f.user.id)}
              >
                Retirer des amis
              </DropdownMenu.Item>
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
              <DropdownMenu.Item
                onclick={() => friendManager.unblock_friend(f.user.id)}
              >
                Débloquer
              </DropdownMenu.Item>
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
              <DropdownMenu.Item
                class="text-destructive"
                onclick={() => friendManager.cancel_invitation(f.user.id)}
              >
                Annuler l'invitation
              </DropdownMenu.Item>
            </FriendRow>
          {/each}
        </FriendsSection>
      </div>
    </ScrollArea>
  </section>

  <FriendsFooter
    onmessages={() => (popup = "message")}
    onadd={() => (popup = "add")}
    onlogout={logout}
  />
</aside>

<Sheet.Root
  open={popup !== ""}
  onOpenChange={(open) => {
    if (!open) {
      popup = "";
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
        {$t(popup === "add" ? "FRIENDS.ADD_CONTACT" : "FRIENDS.MESSAGING")}
      </Sheet.Title>
    </Sheet.Header>

    <div class="flex flex-col gap-4 p-4">
      {#if popup === "message"}
        <ChatPanel bind:selectedValue />
      {:else if popup === "add"}
        <AddFriendForm />
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
