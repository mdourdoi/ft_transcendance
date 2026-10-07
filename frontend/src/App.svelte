<script lang="ts">
  import { path, resolve, type Routes } from "$lib/router";
  import Home_main from "./routes/Home_main.svelte";
  import Game from "./routes/Game.svelte";
  import NotFound from "./routes/NotFound.svelte";
  import Log from "./routes/Log.svelte";
  import LocaleSwitcher from "$lib/components/LocaleSwitcher.svelte";
  import LegalFooter from "$lib/components/LegalFooter.svelte";
  import PageTransition from "$lib/components/PageTransition.svelte";
  import { token } from "$lib/auth";
  import { navigate } from "$lib/router";
  import "$lib/socket";
  import Privacy from "./routes/Privacy.svelte";
  import AccountDelete from "./routes/AccountDelete.svelte";
  import PrivacyPolicy from "./routes/PrivacyPolicy.svelte";
  import VerifyEmail from "./routes/VerifyEmail.svelte";
  import Terms from "./routes/Terms.svelte";

const publicPaths = ["/", "/account/delete", "/verify-email", "/privacy-policy", "/terms"];

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
    "/privacy": Privacy,
    "/account/delete": AccountDelete,
    "/privacy-policy": PrivacyPolicy,
    "/terms": Terms,
    "/verify-email": VerifyEmail
  };

  const route = $derived(resolve(routes, $path));
</script>

<div class="fixed top-3 right-3 z-50">
  <LocaleSwitcher />
</div>

<div class="fixed bottom-2 left-3 z-50 rounded-lg bg-card/70 backdrop-blur-sm">
  <LegalFooter />
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
