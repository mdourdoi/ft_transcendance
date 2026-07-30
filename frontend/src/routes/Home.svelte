<script lang="ts">
  import { navigate } from "$lib/router";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
</script>

<main class="flex min-h-screen items-center justify-center p-6">
  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title>ft_transcendence</Card.Title>
      <Card.Description>Onitama</Card.Description>
    </Card.Header>
    <Card.Content>
      <Button class="w-full" onclick={() => navigate("/game")}>Jouer</Button>
    </Card.Content>
  </Card.Root>
</main>
