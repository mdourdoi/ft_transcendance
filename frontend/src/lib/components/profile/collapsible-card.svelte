<script lang="ts">
  import type { Snippet } from "svelte";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import * as Collapsible from "$lib/components/ui/collapsible";
  import { cn } from "$lib/utils";

  let {
    title,
    description,
    open = $bindable(false),
    children,
  }: {
    title: string;
    description: string;
    open?: boolean;
    children: Snippet;
  } = $props();
</script>

<Collapsible.Root bind:open class="shrink-0">
  <Card.Root
    class={cn("bg-card/80 backdrop-blur-sm", !open && "pb-(--card-spacing)!")}
    aria-label={title}
  >
    <Card.Header class="flex items-center gap-3">
      <Collapsible.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon-sm"
            aria-label={title}
            class="[&>svg]:transition-transform data-[state=open]:[&>svg]:rotate-180"
          >
            <ChevronDown />
          </Button>
        {/snippet}
      </Collapsible.Trigger>
      <div class="flex flex-col gap-1">
        <Card.Title class="font-display text-lg">{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </div>
    </Card.Header>
    <Collapsible.Content class="flex flex-col gap-(--card-spacing)">
      {@render children()}
    </Collapsible.Content>
  </Card.Root>
</Collapsible.Root>
