<script lang="ts">
  import { t } from "$lib/i18n";
  import { navigate } from "$lib/router";
  import { Button } from "$lib/components/ui/button";

  const links = [
    { href: "/privacy-policy", label: "POLICY.TITLE" },
    { href: "/terms", label: "TERMS.TITLE" },
  ];
</script>

<footer class="flex gap-1">
  {#each links as link (link.href)}
    <Button
      variant="ghost"
      size="xs"
      href={link.href}
      onclick={(event: MouseEvent) => {
        event.preventDefault();
        navigate(link.href, { useAnimation: true });
      }}
    >
      {$t(link.label)}
    </Button>
  {/each}
</footer>
