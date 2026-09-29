<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Carousel from '$lib/components/ui/carousel';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context';
	import { InkQuote } from '$lib/components/onitama';
	import { cn } from '$lib/utils';

	const news = [
		{ title: 'Nouvelle saison', text: 'De nouveaux défis vous attendent sur le chemin.', image: '../assets/home/background/actuality_1.png' },
		{ title: 'Tournoi du temple', text: 'Affrontez les meilleurs disciples du dojo.', image: '../assets/home/background/actuality_1.png' },
		{ title: 'Nouvelles cartes', text: 'Maîtrisez de nouveaux déplacements.', image: '../assets/home/background/actuality_1.png' },
	];

	const modes = [
		{ label: 'Partie classée', title: 'Ranked games', image: '../assets/home/background/ranked_card.png' },
		{ label: 'Partie normale', title: 'Normal games', image: '../assets/home/background/normal_card.png' },
		{ label: 'Défis', title: 'Training games', image: '../assets/home/background/training_card.png' },
	];

	let api = $state<CarouselAPI>();
	let current = $state(0);

	$effect(() => {
		if (!api) return;
		current = api.selectedScrollSnap();
		api.on('select', () => (current = api!.selectedScrollSnap()));
	});
</script>

<div class="grid h-full min-h-0 grid-rows-[minmax(300px,52%)_minmax(0,1fr)] gap-4 pt-1">
	<section class="relative overflow-hidden rounded-2xl bg-[url(/assets/home/background/home.png)] bg-[length:100%_100%] shadow-md ring-1 ring-foreground/15">
		<Button
			variant="ghost"
			aria-label="Jouer"
			class="absolute top-[75%] left-[69%] h-auto w-[clamp(300px,32vw,520px)] -translate-x-1/2 -translate-y-1/2 p-0 transition-transform hover:scale-[1.035] hover:bg-transparent hover:drop-shadow-lg active:scale-95"
		>
			<img class="pointer-events-none w-full select-none" src="../assets/home/boutton/play.png" alt="Jouer" />
		</Button>
	</section>

	<section class="grid min-h-0 grid-cols-[minmax(280px,37%)_minmax(0,1fr)] gap-4">
		<Carousel.Root setApi={(a) => (api = a)} opts={{ loop: true }} class="relative min-h-0 overflow-hidden rounded-2xl bg-secondary text-secondary-foreground shadow-md [&>[data-slot=carousel-content]]:h-full">
			<Carousel.Content class="ms-0 h-full">
				{#each news as item (item.title)}
					<Carousel.Item class="relative h-full ps-0">
						<img class="absolute inset-0 size-full object-cover" src={item.image} alt="" />
						<div class="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-secondary/95"></div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			<Badge class="absolute top-3 left-3 rounded-sm px-3 py-1 font-display text-sm tracking-widest">ACTUALITÉS</Badge>
			<div class="absolute inset-x-5 bottom-3 flex flex-col gap-2">
				<h2 class="font-display text-2xl">{news[current].title}</h2>
				<p class="text-sm text-secondary-foreground/80">{news[current].text}</p>
				<div class="flex items-center justify-between">
					<Button variant="ghost" size="icon" class="text-2xl text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground" aria-label="Actualité précédente" onclick={() => api?.scrollPrev()}>‹</Button>
					<div class="flex gap-2">
						{#each news as item, index (item.title)}
							<Button
								variant="ghost"
								aria-label={`Actualité ${index + 1}`}
								class={cn('size-2.5 rounded-full p-0 hover:bg-secondary-foreground/60', current === index ? 'bg-secondary-foreground' : 'bg-secondary-foreground/30')}
								onclick={() => api?.scrollTo(index)}
							></Button>
						{/each}
					</div>
					<Button variant="ghost" size="icon" class="text-2xl text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground" aria-label="Actualité suivante" onclick={() => api?.scrollNext()}>›</Button>
				</div>
			</div>
		</Carousel.Root>

		<div class="grid min-h-0 grid-cols-3 grid-rows-[minmax(0,1fr)_auto] gap-3">
			{#each modes as mode (mode.title)}
				<Button
					variant="ghost"
					aria-label={mode.label}
					class="group relative h-full min-h-0 overflow-hidden rounded-xl p-0 shadow-sm ring-1 ring-foreground/15 transition-transform hover:-translate-y-1 hover:bg-transparent hover:shadow-lg active:translate-y-0"
				>
					<img class="pointer-events-none size-full object-cover select-none" src={mode.image} alt="" />
					<span class="absolute inset-x-0 bottom-0 bg-secondary/85 py-1.5 font-display text-sm tracking-widest text-secondary-foreground uppercase">
						{mode.title}
					</span>
				</Button>
			{/each}
			<InkQuote class="col-span-3" quote="Un petit pas déplace un grand destin." />
		</div>
	</section>
</div>
