<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import X from "@lucide/svelte/icons/x";
  import { Button } from "$lib/components/ui/button";
  import * as Avatar from "$lib/components/ui/avatar";

  let {
    user,
    onaccept,
    ondeny,
  }: {
    user: { username: string; avatarUrl: string };
    onaccept: () => void;
    ondeny: () => void;
  } = $props();
</script>

<div
  class="flex items-center justify-between rounded-md bg-card/40 p-2 hover:bg-accent/50"
>
  <div class="flex min-w-0 items-center gap-2">
    <Avatar.Root class="size-8">
      <Avatar.Image src={`/api/avatars/${user.avatarUrl}`} alt={user.username} />
      <Avatar.Fallback>{user.username.slice(0, 2).toUpperCase()}</Avatar.Fallback>
    </Avatar.Root>
    <span class="truncate text-sm font-medium">{user.username}</span>
  </div>

  <div class="flex items-center gap-1">
    <Button
      variant="ghost"
      size="icon"
      class="size-7 bg-white font-extrabold text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400"
      title="Accepter"
      onclick={onaccept}
    >
      <Check class="size-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      class="size-7 bg-white font-extrabold text-destructive hover:bg-destructive/20 hover:text-destructive"
      title="Refuser"
      onclick={ondeny}
    >
      <X class="size-4" />
    </Button>
  </div>
</div>
