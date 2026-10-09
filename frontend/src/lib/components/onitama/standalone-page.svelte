<script lang="ts">
	import background from "../../../../assets/Login_background.png";
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import { navigate } from "$lib/router";
	import { cn } from "$lib/utils.js";
	import { t } from "$lib/i18n";
	import type { Snippet } from "svelte";
	import PageHeader from "./page-header.svelte";

	let {
		title,
		subtitle,
		class: className,
		children,
	}: {
		title: string;
		subtitle?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div class="relative min-h-screen w-full">
	<img class="pointer-events-none fixed inset-0 size-full object-cover select-none" src={background} alt="" />
	<main class="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-[8vh]">
		<Card.Root class={cn("bg-card/90 backdrop-blur-sm", className)}>
			<Card.Content class="flex flex-col gap-6">
				<PageHeader {title} {subtitle}>
					<Button variant="outline" onclick={() => navigate("/", { useAnimation: true })}>
						{$t("COMMON.BACK")}
					</Button>
				</PageHeader>
				{@render children()}
			</Card.Content>
		</Card.Root>
	</main>
</div>
