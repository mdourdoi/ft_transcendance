<script lang="ts">
  import { navigate } from "$lib/router";
  import { Button } from "$lib/components/ui/button";
  import Plateau from "$lib/components/game/plateau/Plateau.svelte";
</script>

<main class="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
  <h1 class="text-3xl font-semibold tracking-tight">Partie</h1>
  <div class="grid gap-0">
    <Plateau width="3rem" height="3rem" size={5} />
  </div>
  <Button variant="outline" onclick={() => navigate("/")}>Retour</Button>
</main>
