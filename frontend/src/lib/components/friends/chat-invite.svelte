<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Stamp } from "$lib/components/onitama";
  import { inviteManager } from "$lib/stores/invites.svelte";
  import { t } from "$lib/i18n";

  let { friend }: { friend: { id: number; username: string } } = $props();

  const incoming = $derived(inviteManager.incoming[friend.id]);
  const outgoing = $derived(inviteManager.outgoing[friend.id]);
  const declined = $derived(inviteManager.declined[friend.id]);
</script>

{#if incoming || outgoing || declined}
  <div
    role="status"
    class="flex animate-in items-center gap-3 rounded-lg bg-secondary p-2 text-secondary-foreground shadow-sm duration-300 fade-in-0 slide-in-from-bottom-2"
  >
    <Stamp kanji="戦" class="size-9 shrink-0 text-lg" />
    <div class="flex min-w-0 flex-1 flex-col">
      {#if incoming}
        <strong class="truncate text-sm">{$t("INVITES.RECEIVED", { values: { name: friend.username } })}</strong>
        <span class="text-xs opacity-70">{$t("INVITES.EXPIRES", { values: { seconds: inviteManager.secondsLeft(incoming.expiresAt) } })}</span>
      {:else if outgoing}
        <strong class="truncate text-sm">{$t("INVITES.SENT")}</strong>
        <span class="text-xs opacity-70">{$t("INVITES.EXPIRES", { values: { seconds: inviteManager.secondsLeft(outgoing) } })}</span>
      {:else}
        <strong class="truncate text-sm">{$t("INVITES.DECLINED", { values: { name: friend.username } })}</strong>
      {/if}
    </div>
    {#if incoming}
      <Button size="sm" onclick={() => inviteManager.accept(friend.id)}>{$t("INVITES.ACCEPT")}</Button>
      <Button size="sm" variant="outline" class="bg-transparent" onclick={() => inviteManager.decline(friend.id)}>{$t("INVITES.DECLINE")}</Button>
    {:else if outgoing}
      <Button size="sm" variant="outline" class="bg-transparent" onclick={() => inviteManager.cancel(friend.id)}>{$t("COMMON.CANCEL")}</Button>
    {/if}
  </div>
{/if}
