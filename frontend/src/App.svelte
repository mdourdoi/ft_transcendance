<script lang="ts">
  import { path, resolve, type Routes } from "$lib/router";
  import Home from "./routes/Home.svelte";
  import Game from "./routes/Game.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import Privacy from "./routes/Privacy.svelte";
  import AccountDelete from "./routes/AccountDelete.svelte";
  import PrivacyPolicy from "./routes/PrivacyPolicy.svelte";
  import Terms from "./routes/Terms.svelte";
  import LocaleSwitcher from "$lib/components/LocaleSwitcher.svelte";
  import PageTransition from "$lib/components/PageTransition.svelte";

  const routes: Routes = {
    "/": Home,
    "/game": Game,
    "/settings/privacy": Privacy,
    "/account/delete": AccountDelete,
    "/privacy-policy": PrivacyPolicy,
    "/terms": Terms,
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
