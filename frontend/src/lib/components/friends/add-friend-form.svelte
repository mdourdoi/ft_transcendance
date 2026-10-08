<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { t } from "$lib/i18n";
  import { friendManager } from "$lib/stores/friend.svelte";
</script>

<form class="flex flex-col gap-2" onsubmit={friendManager.add_friend}>
  <Label for="contact_login">Pseudo du contact</Label>
  <Input
    id="contact_login"
    maxlength={40}
    autocomplete="off"
    bind:value={friendManager.to_add}
    onblur={() => (friendManager.error = "")}
  />
  {#if friendManager.error}
    <p role="alert" class="text-sm font-semibold text-destructive">
      {$t(`ERRORS.${friendManager.error}`, { default: $t("ERRORS.UNKNOWN_ERROR") })}
    </p>
  {/if}
  <Button type="submit" class="self-end">{$t("FRIENDS.ADD")}</Button>
</form>
