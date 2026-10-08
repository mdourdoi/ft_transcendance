<script lang="ts">
  import { cn } from "$lib/utils";
  import type { ChatMessage } from "$lib/socket";

  let { message, mine, time }: { message: ChatMessage; mine: boolean; time: string } = $props();
</script>

<div
  class={cn(
    "flex max-w-[85%] animate-in flex-col gap-0.5 duration-300 fade-in-0 slide-in-from-bottom-2",
    mine ? "items-end self-end" : "items-start self-start",
  )}
>
  <p
    class={cn(
      "rounded-xl px-3 py-1.5 text-sm break-words whitespace-pre-wrap shadow-sm",
      mine
        ? "rounded-br-sm bg-primary text-primary-foreground"
        : "rounded-bl-sm bg-secondary text-secondary-foreground",
    )}
  >
    {message.content}
  </p>
  <time datetime={message.createdAt} class="px-1 text-[10px] text-muted-foreground">{time}</time>
</div>
