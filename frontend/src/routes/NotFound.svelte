<script lang="ts">
  import { path, navigate } from "$lib/router";
  import { Button } from "$lib/components/ui/button";
  import { t } from "$lib/i18n";
</script>

<main class="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
  <h1 class="text-5xl font-bold tracking-tight">404</h1>
  <p class="text-muted-foreground">
    <code class="bg-muted rounded px-1.5 py-0.5 font-mono text-sm">{$path}</code>
    {$t("NOTFOUND.MISSING")}
  </p>
  <Button variant="outline" onclick={() => navigate("/")}>{$t("NOTFOUND.HOME")}</Button>
</main>
