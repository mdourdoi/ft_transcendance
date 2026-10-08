<script lang="ts">
  import type { Snippet } from "svelte";
  import { Badge } from "$lib/components/ui/badge";
  import { cn } from "$lib/utils";
  import { Separator } from "$lib/components/ui/separator";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Card from "$lib/components/ui/card";
  import { t } from "$lib/i18n";
  import AvatarUploader from "./avatar-uploader.svelte";

  let {
    name,
    avatarUrl,
    rating = null,
    editable = false,
    children,
  }: {
    name: string;
    avatarUrl: string | null;
    rating?: number | null;
    editable?: boolean;
    children?: Snippet;
  } = $props();

  const player = $derived({
    name,
    title: $t("PROFILE.DEFAULT_TITLE"),
    quote: $t("PROFILE.DEFAULT_QUOTE"),
  });

  const avatarSrc = $derived(`/api/avatars/${avatarUrl ?? "default.png"}`);
</script>

<Card.Root
  class="shrink-0 bg-card/80 backdrop-blur-sm"
  aria-label={$t("PROFILE.IDENTITY")}
>
  <Card.Content
    class={cn(
      "grid items-center gap-6",
      children ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-[auto_minmax(0,1fr)]",
    )}
  >
    <div class="flex flex-col items-center gap-2">
      <div class="relative">
        <Avatar.Root
          class="size-24 border-4 border-secondary shadow-[0_0_0_2px_var(--accent)]"
        >
          <Avatar.Image src={avatarSrc} alt={`Avatar de ${player.name}`} />
          <Avatar.Fallback>{player.name.slice(0, 2)}</Avatar.Fallback>
        </Avatar.Root>
        {#if editable}
          <AvatarUploader />
        {/if}
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-1">
      <h2 class="flex items-center gap-1 font-display text-3xl font-bold">
        {player.name}
        {#if rating !== null}
          <Badge class="ml-2 rounded-sm px-2 py-0.5 font-display text-sm tracking-widest">
            {$t("PROFILE.ELO", { values: { elo: rating } })}
          </Badge>
        {/if}
      </h2>
      <span class="flex items-center gap-1 text-sm font-semibold">
        {player.title}
      </span>
      <Separator class="my-2 w-24 bg-primary" />
      <q class="text-sm text-muted-foreground italic">{player.quote}</q>
    </div>
    {@render children?.()}
  </Card.Content>
</Card.Root>
