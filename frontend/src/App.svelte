<script lang="ts">
  import { path, resolve, type Routes } from "$lib/router";
  import Home_main from "./routes/Home_main.svelte";
  import Game from "./routes/Game.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import Log from "./routes/Log.svelte";
  import LocaleSwitcher from "$lib/components/LocaleSwitcher.svelte";
  import PageTransition from "$lib/components/PageTransition.svelte";
  import { token } from "$lib/auth";
  import { navigate } from "$lib/router";
  import "$lib/socket";

const publicPaths = ["/"];

$effect(() => {
  const connected = !!$token;
  const isPublic = publicPaths.includes($path);

  if (!connected && !isPublic) navigate("/", { replace: true });
  if (connected && $path === "/") navigate("/home", { replace: true });
});

  const routes: Routes = {
    "/": Log,
    "/game": Game,
    "/game/:mode": Game,
    "/home": Home_main,
  };

  const route = $derived(resolve(routes, $path));
</script>

<div class="fixed top-3 right-3 z-50">
  <LocaleSwitcher />
</div>

{#key $path}
  <PageTransition>
    {#if route}
      {@const Page = route.component}
      <Page {...route.params} />
    {:else}
      <NotFound />
    {/if}
  </PageTransition>
{/key}
