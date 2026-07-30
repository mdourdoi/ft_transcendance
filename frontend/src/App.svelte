<script lang="ts">
  import { path, resolve, type Routes } from "$lib/router";
  import Home from "./routes/Home.svelte";
  import Game from "./routes/Game.svelte";
  import NotFound from "./routes/NotFound.svelte";

  const routes: Routes = {
    "/": Home,
    "/game": Game,
  };

  const route = $derived(resolve(routes, $path));
</script>

{#if route}
  {@const Page = route.component}
  <Page {...route.params} />
{:else}
  <NotFound />
{/if}
