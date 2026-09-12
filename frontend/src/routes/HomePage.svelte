<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import Search from "@lucide/svelte/icons/search";
  import SettingsIcone from "@lucide/svelte/icons/settings";
  import Notification from "@lucide/svelte/icons/bell";
  import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import Autoplay from "embla-carousel-autoplay";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Carousel from "$lib/components/ui/carousel/index.js";

  const plugin = Autoplay({ delay: 1900, stopOnInteraction: true });

  let onglet = "";

  function OngletChange (Mode: string) {
    onglet = Mode;
    console.log(onglet);
  }

</script>

<div class="fixed inset-0 h-screen w-screen bg-zinc-950 text-white overflow-hidden">
  <Resizable.PaneGroup direction="horizontal" class="h-full w-full">
    <Resizable.Pane defaultSize={80} class="flex items-center justify-center border-r border-zinc-800">
      <Resizable.PaneGroup direction="vertical">
        <Resizable.Pane defaultSize={15} class="flex items-center justify-center p-4">
                  <div class="flex justify-start items-start">
            <Avatar.Root class="h-50 w-50">
              <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
              <Avatar.Fallback>CN</Avatar.Fallback>
            </Avatar.Root>
            </div>
        <div class="flex justify-center items-center gap-2 w-full">
        <ButtonGroup.Root>
          <Button variant="secondary" size="sm" onclick={() => OngletChange("home")}>acceuile</Button>
          <ButtonGroup.Separator />
          <Button variant="secondary" size="sm" onclick={() => OngletChange("historique")}>historique</Button>
          <ButtonGroup.Separator />
          <Button variant="secondary" size="sm" onclick={() => OngletChange("stats")}>stats</Button>
          </ButtonGroup.Root>
          </div>
          <div class="flex justify-end items-start h-16 flex-1 p-2">
            <Button >
              <SettingsIcone />
            </Button>
            <Button >
              <Notification />
            </Button>
          </div>
        </Resizable.Pane>
      <Resizable.Handle disabled class="h-px bg-zinc-800 cursor-default pointer-events-none" />
<Resizable.Pane defaultSize={85} class="relative flex flex-col justify-between h-full p-6">
  <div class="w-full max-w-sm ml-0 mt-140">
    <Carousel.Root plugins={[plugin]} class="w-full">
      <Carousel.Content>
        {#each Array(5) as _, i (i)}
          <Carousel.Item>
            <div class="p-1">
              <Card.Root>
                <Card.Content class="flex aspect-square items-center justify-center p-6">
                  <span class="text-4xl font-semibold">{i + 1}</span>
                </Card.Content>
              </Card.Root>
            </div>
          </Carousel.Item>
        {/each}
      </Carousel.Content>
<div class="flex justify-center gap-4 mt-4">
    <Carousel.Previous class="static translate-y-0" />
    <Carousel.Next class="static translate-y-0" />
  </div>
    </Carousel.Root>
  </div>
  <div class="absolute inset-x-0 bottom-8 flex justify-center mb-120 ml-390">
    <Button >
      Jouer
    </Button>
  </div>
<div class="absolute inset-x-0 bottom-24 flex justify-center mb-50">
    <ButtonGroup.Root>
    <Button variant="secondary" size="sm">ranked</Button>
    <ButtonGroup.Separator />
    <Button variant="secondary" size="sm">clasique</Button>
    <ButtonGroup.Separator />
    <Button variant="secondary" size="sm">bot</Button>
    </ButtonGroup.Root>
  </div>
</Resizable.Pane>
      </Resizable.PaneGroup>
    </Resizable.Pane>
    <Resizable.Handle disabled class="w-px bg-zinc-800 cursor-default pointer-events-none" />
    <Resizable.Pane defaultSize={20}>
      <Resizable.PaneGroup direction="vertical">
        <Resizable.Pane defaultSize={15} class="flex items-center justify-center p-4">
          <div class="text-lg font-semibold">Two - Haut</div>
        </Resizable.Pane>
        <Resizable.Handle disabled class="h-px bg-zinc-800 cursor-default pointer-events-none" />
        <Resizable.Pane defaultSize={85} class="flex flex-col p-4 gap-4 justify-start items-center">
        <ButtonGroup.Root>
          <Input placeholder="Rechercher un ami..." />
          <Button variant="outline" size="icon" aria-label="Search">
            <Search />
          </Button>
        </ButtonGroup.Root>
        </Resizable.Pane>
      </Resizable.PaneGroup>
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>