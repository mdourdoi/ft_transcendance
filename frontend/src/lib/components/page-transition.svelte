<script lang="ts">
  import { get } from "svelte/store";
  import { animate } from "motion";
  import { animateNavigation } from "$lib/router";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  let el = $state<HTMLElement>();

  $effect(() => {
    if (!el || !get(animateNavigation)) return;
    animate(
      el,
      { opacity: [0, 1], y: [12, 0] },
      { duration: 0.25, ease: "easeOut" },
    );
  });
</script>

<div bind:this={el}>
  {@render children()}
</div>
