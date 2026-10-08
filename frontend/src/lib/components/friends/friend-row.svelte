<script lang="ts">
  import type { Snippet } from "svelte";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import { Button } from "$lib/components/ui/button";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
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

<div
  class={cn("flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/70", className)}
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

  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="icon"
          class="size-8 shrink-0"
          aria-label="Options"
        >
          <Ellipsis class="text-muted-foreground" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      {@render children()}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
