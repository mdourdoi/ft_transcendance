<script lang="ts">
  import { path, resolve, type Routes } from "$lib/router";
  import Home from "./routes/Home.svelte";
  import Game from "./routes/Game.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import Login from "./routes/Login.svelte";
  import LocaleSwitcher from "$lib/components/locale-switcher.svelte";
  import PageTransition from "$lib/components/page-transition.svelte";
  import { token } from "$lib/auth";
  import { navigate } from "$lib/router";
  import "$lib/socket";

const publicPaths = ["/"];

$effect(() => {
  const connected = $token !== "";
  const isPublic = publicPaths.includes($path);

  if (!connected && !isPublic) navigate("/", { replace: true });
  if (connected && $path === "/") navigate("/home", { replace: true });
});

  const routes: Routes = {
    "/": Login,
    "/game": Game,
    "/game/:mode": Game,
    "/home": Home,
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
