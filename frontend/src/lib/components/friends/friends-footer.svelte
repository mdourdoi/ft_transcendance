<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import { t } from "$lib/i18n";

  let {
    onmessages,
    onadd,
    onlogout,
  }: { onmessages: () => void; onadd: () => void; onlogout: () => void } = $props();

  const actions = $derived([
    { label: $t("FRIENDS.MESSAGES"), icon: "../assets/home/icone/message.png", onclick: onmessages },
    { label: $t("FRIENDS.ADD_FRIEND"), icon: "../assets/home/icone/add-friend.png", onclick: onadd },
    { label: $t("FRIENDS.LOGOUT"), icon: "../assets/Icone/connexion.png", onclick: onlogout, dim: true },
  ]);
</script>

<footer class="relative h-[77px]">
  <img
    class="pointer-events-none absolute inset-0 size-full"
    src="../assets/home/background/social-footer-base.webp"
    alt=""
  />
  <div class="relative flex h-full items-center justify-end gap-6 pr-6">
    {#each actions as action, index (action.icon)}
      {#if index > 0}
        <span class="h-8 w-px bg-secondary-foreground/40"></span>
      {/if}
      <Button
        variant="ghost"
        size="icon-lg"
        class="size-12 hover:scale-110 hover:bg-secondary-foreground/10"
        aria-label={action.label}
        onclick={action.onclick}
      >
        <img
          class={cn("size-8 object-contain", action.dim && "brightness-0 invert-[.55]")}
          src={action.icon}
          alt=""
        />
      </Button>
    {/each}
  </div>
</footer>
