<script lang="ts">
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import SettingsIcone from "@lucide/svelte/icons/settings";
  import { LogOut as Quit} from "@lucide/svelte";
  import Notification from "@lucide/svelte/icons/bell";
  import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<div class="relative min-h-screen flex flex-col items-center justify-center p-6">
  <div class="absolute top-6 left-1/2 -translate-x-1/2 ml-260">
    <ButtonGroup.Root>
      <Button variant="secondary" size="sm" onclick={() => console.log("MessageSquare")}><MessageSquare /></Button>
      <ButtonGroup.Separator />
      <Button variant="secondary" size="sm" onclick={() => console.log("Notification")}><Notification /></Button>
      <ButtonGroup.Separator />
      <Button variant="secondary" size="sm" onclick={() => console.log("Settings")}><SettingsIcone /></Button>
      <ButtonGroup.Separator />
      <Button variant="secondary" size="sm" onclick={() => console.log("Quit")}><Quit /></Button>
    </ButtonGroup.Root>
  </div>
  <h1 class ="mb-15">game</h1>
  <div class="flex items-start justify-center w-full mb-30">
    <div class="w-120 h-160 shrink-0 border rounded-md p-4">
      Bloc joueur 1
    </div>
    <div class="w-200 h-200 flex-1 max-w-2xl border rounded-md p-4">
      Bloc de jeux
    </div>
    <div class="w-120 h-160 shrink-0 border rounded-md p-4">
      Bloc joueur 2
    </div>
  </div>
</div>