<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar";
  import { t } from "$lib/i18n";

  let { username, avatar }: { username: string; avatar: string } = $props();
</script>

<section class="relative overflow-hidden">
  <img
    class="pointer-events-none absolute inset-0 size-full"
    src="../assets/home/background/profil-vide.webp"
    alt=""
  />
  <div class="relative flex h-full items-center gap-[1vw] px-[1.3vw]">
    <div class="relative">
      <Avatar.Root
        class="size-[6vw] max-h-[11vh] max-w-[11vh] rounded-md after:rounded-full after:border-0"
      >
        <Avatar.Image
          src={`/api/avatars/${avatar}`}
          alt={username}
          class="rounded-full"
        />
        <Avatar.Fallback></Avatar.Fallback>
      </Avatar.Root>
    </div>
    <div class="flex min-w-0 flex-col gap-1">
      <strong class="truncate text-xl text-secondary-foreground"
        >{username}</strong
      >
      <span class="flex items-center gap-2 text-sm text-emerald-400">
        <span class="size-2.5 rounded-full bg-emerald-500"></span>
        {$t("FRIENDS.STATUS.ONLINE")}
      </span>
    </div>
  </div>
</section>
