<script>
  import { path, resolve } from "./lib/router.js";
  import Home from "./routes/Home.svelte";
  import Game from "./routes/Game.svelte";
  import NotFound from "./routes/NotFound.svelte";

  const routes = {
    "/": Home,
    "/game": Game,
  };
  $: route = resolve(routes, $path);
</script>

{#if route}
  <svelte:component this={route.component} {...route.params} />
{:else}
  <NotFound />
{/if}