<script lang="ts">
  import type { Snippet } from "svelte";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { cn } from "$lib/utils";

  let {
    label,
    count,
    empty,
    class: className,
    children,
  }: {
    label: string;
    count: number;
    empty: string;
    class?: string;
    children: Snippet;
  } = $props();

  let open = $state(false);
</script>

<div class="flex flex-col gap-1">
  <button
    type="button"
    class="flex items-center gap-2 px-1 pt-1 text-left text-xs font-bold tracking-widest text-muted-foreground hover:text-foreground"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <ChevronDown
      class={cn("size-4 transition-transform duration-200", !open && "-rotate-90")}
    />
    {label} ({count})
  </button>
  {#if open}
    <div class={cn("flex flex-col gap-1", className)}>
      {#if count === 0}
        <p class="py-2 text-center text-xs text-muted-foreground">
          {empty}
        </p>
      {:else}
        {@render children()}
      {/if}
    </div>
  {/if}
</div>
