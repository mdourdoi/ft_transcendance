<script lang="ts">
  import { navigate } from "$lib/router";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { t } from "$lib/i18n";
</script>

<main class="flex min-h-screen items-center justify-center p-6">
  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title>ft_transcendence</Card.Title>
      <Card.Description>{$t("HOME.SUBTITLE")}</Card.Description>
    </Card.Header>
    <Card.Content>
      <Button class="w-full" onclick={() => navigate("/game")}>{$t("HOME.PLAY")}</Button>
    </Card.Content>
  </Card.Root>
</main>
