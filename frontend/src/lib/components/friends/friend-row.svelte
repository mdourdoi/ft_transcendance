<script lang="ts">
  import type { Snippet } from "svelte";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as ContextMenu from "$lib/components/ui/context-menu";
  import { cn } from "$lib/utils";

  let {
    user,
    status,
    class: className,
    children,
  }: {
    user: { username: string; avatarUrl?: string | null };
    status?: { label: string; dot: string; text: string } | null;
    class?: string;
    children: Snippet;
  } = $props();
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger
    class={cn(
      "flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/70 data-[state=open]:bg-accent/70",
      className,
    )}
  >
    <Avatar.Root class="size-10">
      <Avatar.Image
        src={`/api/avatars/${user.avatarUrl ?? "default.png"}`}
        alt={user.username}
      />
      <Avatar.Fallback>{user.username.slice(0, 2)}</Avatar.Fallback>
      {#if status}
        <Avatar.Badge class={status.dot} />
      {/if}
    </Avatar.Root>
    <span class="flex min-w-0 flex-1 flex-col items-start">
      <strong class="truncate text-sm">{user.username}</strong>
      {#if status !== undefined}
        <span class={cn("text-xs", status?.text ?? "text-muted-foreground")}>
          {status?.label ?? "Hors ligne"}
        </span>
      {/if}
    </span>
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    {@render children()}
  </ContextMenu.Content>
</ContextMenu.Root>
