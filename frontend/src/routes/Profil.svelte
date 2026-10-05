<script lang="ts">
	import Camera from "@lucide/svelte/icons/camera";
	import Pencil from "@lucide/svelte/icons/pencil";
	import Lock from "@lucide/svelte/icons/lock";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Progress } from "$lib/components/ui/progress";
	import { Separator } from "$lib/components/ui/separator";
	import * as Avatar from "$lib/components/ui/avatar";
	import * as Card from "$lib/components/ui/card";
	import * as Tabs from "$lib/components/ui/tabs";
	import { InkQuote, PageShell, SideNav, Stamp } from "$lib/components/onitama";
	import { cn } from "$lib/utils";

	type Section = "overview" | "achievements" | "customization" | "setting";
	type Achievement = { title: string; description: string; image: string; unlocked?: boolean; progress?: number };

	let {
		onCustomize = () => {},
		player = { name: "Kenshii", title: "Disciple du vent", quote: "Le calme est ma force.", level: 42, xp: 6500, xpTarget: 10000, avatar: "../assets/home/avatar/avatar-kenshii.png" },
	}: {
		onCustomize?: (section: "avatar" | "frame" | "title" | "name" | "all") => void;
		player?: { name: string; title: string; quote: string; level: number; xp: number; xpTarget: number; avatar: string };
	} = $props();

	const sections: { value: Section; label: string }[] = [
		{ value: "overview", label: "Vue d’ensemble" },
		{ value: "achievements", label: "Succès" },
		{ value: "customization", label: "Personnaliser" },
		{ value: "setting", label: "Paramètres" },
	];

	let profileSection = $state<Section>("overview");

	const achievements: Achievement[] = [
		{ title: "Premier pas", description: "Remporter une partie.", image: "../assets/home/avatar/dragon.png", unlocked: true },
		{ title: "Esprit du tigre", description: "Gagner 10 parties.", image: "../assets/home/avatar/dragon.png", unlocked: true },
		{ title: "Voie du temple", description: "Gagner par le temple.", image: "../assets/home/avatar/dragon.png", unlocked: true },
		{ title: "Série parfaite", description: "4 / 5 victoires consécutives.", image: "../assets/home/avatar/dragon.png", progress: 80 },
		{ title: "Cent victoires", description: "73 / 100 victoires.", image: "../assets/home/avatar/dragon.png", progress: 73 },
		{ title: "Maître du dojo", description: "Atteindre le niveau 50.", image: "../assets/home/avatar/dragon.png", progress: 0 },
		{ title: "Maître du dojo", description: "Atteindre le niveau 50.", image: "../assets/home/avatar/dragon.png", progress: 0 },
	];

	const levelProgress = $derived(player.xpTarget > 0 ? Math.max(0, Math.min(100, Math.round((player.xp / player.xpTarget) * 100))) : 0);
	const visibleAchievements = $derived(profileSection === "achievements" ? achievements : achievements.slice(0, 6));
	const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

	const showAchievements = $derived(profileSection === "overview" || profileSection === "achievements");
	const showCustomization = $derived(profileSection === "overview" || profileSection === "customization");
	const showSettings = $derived(profileSection === "overview" || profileSection === "setting");
</script>

<Tabs.Root bind:value={profileSection} orientation="vertical" class="h-full">
	<PageShell title="Mon Profil" subtitle="Montre ton style et ta patience">
		{#snippet sidebar()}
			<SideNav label="Rubriques du profil" items={sections} />
			<InkQuote class="mt-auto" quote="La maîtrise de soi mène à la victoire." author="" stamp />
		{/snippet}

		<Card.Root class="shrink-0 bg-card/80 backdrop-blur-sm" aria-label="Identité et niveau">
			<Card.Content class="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-6">
				<div class="flex flex-col items-center gap-2">
					<div class="relative">
						<Avatar.Root class="size-24 border-4 border-secondary shadow-[0_0_0_2px_var(--accent)]">
							<Avatar.Image src={player.avatar} alt={`Avatar de ${player.name}`} />
							<Avatar.Fallback>{player.name.slice(0, 2)}</Avatar.Fallback>
						</Avatar.Root>
						<Button size="icon-sm" class="absolute right-0 bottom-0 rounded-full" aria-label="Changer la photo" onclick={() => onCustomize("avatar")}>
							<Camera />
						</Button>
					</div>
					<Button variant="outline" size="sm" onclick={() => onCustomize("avatar")}>Changer l’avatar</Button>
				</div>

				<div class="flex min-w-0 flex-col gap-1">
					<h2 class="flex items-center gap-1 font-display text-3xl font-bold">
						{player.name}
						<Button variant="ghost" size="icon-sm" aria-label="Modifier le nom" onclick={() => onCustomize("name")}><Pencil /></Button>
					</h2>
					<span class="flex items-center gap-1 text-sm font-semibold">
						{player.title}
						<Button variant="ghost" size="icon-xs" aria-label="Modifier le titre" onclick={() => onCustomize("title")}><Pencil /></Button>
					</span>
					<Separator class="my-2 w-24 bg-primary" />
					<q class="text-sm text-muted-foreground italic">{player.quote}</q>
				</div>

				<div class="flex items-center gap-4">
					<div class="flex size-20 shrink-0 items-center justify-center rounded-full border-8 border-secondary font-display text-3xl font-bold">
						{player.level}
					</div>
					<div class="flex flex-1 flex-col gap-1.5">
						<div class="flex items-center justify-between">
							<strong class="text-xs tracking-widest">NIVEAU</strong>
							<b class="text-sm text-primary">{levelProgress}%</b>
						</div>
						<Progress value={levelProgress} class="h-2" aria-label="Progression du niveau" />
						<p class="text-xs text-muted-foreground">{player.xp.toLocaleString("fr-FR")} / {player.xpTarget.toLocaleString("fr-FR")} XP</p>
						<small class="text-xs text-muted-foreground">Niveau suivant : {player.level + 1}</small>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		{#if showAchievements}
			<Card.Root class="shrink-0 bg-card/80 backdrop-blur-sm">
				<Card.Header>
					<Card.Title class="font-display text-lg">◒ Succès de partie</Card.Title>
					<Card.Action class="flex items-center gap-3 text-sm">
						<b>{unlockedCount} / {achievements.length} débloqués</b>
						{#if profileSection !== "achievements"}
							<Button variant="link" size="sm" class="px-0" onclick={() => (profileSection = "achievements")}>Voir tous ›</Button>
						{/if}
					</Card.Action>
				</Card.Header>
				<Card.Content class="grid grid-cols-3 gap-3">
					{#each visibleAchievements as achievement, index (index)}
						{@const locked = !achievement.unlocked && achievement.progress === 0}
						<div class={cn("relative flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 transition-transform hover:-translate-y-0.5", locked && "opacity-55 grayscale")}>
							<img class="size-12 shrink-0 object-contain" src={achievement.image} alt="" />
							<div class="flex min-w-0 flex-1 flex-col gap-1">
								<h3 class="truncate font-semibold">{achievement.title}</h3>
								<p class="text-xs text-muted-foreground">{achievement.description}</p>
								{#if achievement.progress !== undefined}
									<div class="flex items-center gap-2">
										<Progress value={achievement.progress} class="h-1.5" />
										<b class="text-xs">{achievement.progress}%</b>
									</div>
								{/if}
							</div>
							{#if achievement.unlocked}
								<Stamp kanji="達" class="absolute top-2 right-2 size-7 text-sm" />
							{:else if locked}
								<Lock class="absolute top-2 right-2 size-4 text-muted-foreground" />
							{/if}
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		{/if}

		{#if showCustomization}
			<Card.Root class="shrink-0 bg-card/80 backdrop-blur-sm">
				<Card.Header>
					<Card.Title class="font-display text-lg">◒ Personnalisation</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-4 gap-3">
					<Button variant="outline" class="h-auto justify-start gap-3 bg-transparent p-3 whitespace-normal" onclick={() => onCustomize("avatar")}>
						<img class="size-12 rounded-full object-cover" src={player.avatar} alt="" />
						<span class="flex flex-col items-start text-left"><b>Avatar</b><small class="text-xs text-muted-foreground">Modifiez votre avatar de profil.</small></span>
					</Button>
					<Button variant="outline" class="h-auto justify-start gap-3 bg-transparent p-3 whitespace-normal" onclick={() => onCustomize("frame")}>
						<span class="size-12 shrink-0 rounded-full border-4 border-double border-primary"></span>
						<span class="flex flex-col items-start text-left"><b>Cadre</b><small class="text-xs text-muted-foreground">Choisissez un cadre pour votre avatar.</small></span>
					</Button>
					<Button variant="outline" class="h-auto justify-start gap-3 bg-transparent p-3 whitespace-normal" onclick={() => onCustomize("title")}>
						<span class="shrink-0 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground">{player.title}</span>
						<span class="flex flex-col items-start text-left"><b>Titre</b><small class="text-xs text-muted-foreground">Affichez votre titre favori.</small></span>
					</Button>
					<div class="flex flex-col items-center justify-center gap-2">
						<Button variant="secondary" onclick={() => onCustomize("all")}>Personnaliser</Button>
						<InkQuote quote="L’apparence suit l’esprit." />
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		{#if showSettings}
			<Card.Root class="shrink-0 bg-card/80 backdrop-blur-sm" aria-label="Paramètres">
				<Card.Header>
					<Card.Title class="font-display text-lg">◒ Paramètres</Card.Title>
					<Card.Description>Ton compte, ton ambiance, ton jeu</Card.Description>
				</Card.Header>
				{#if profileSection === "overview"}
					<Card.Content class="flex items-center justify-between gap-3">
						<p class="text-sm">Compte et sécurité, musique, bruitages et confort de jeu.</p>
						<Button variant="secondary" onclick={() => (profileSection = "setting")}>Ouvrir les paramètres</Button>
					</Card.Content>
				{:else}
					<Card.Content class="grid grid-cols-2 gap-4">
						<section class="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4" aria-labelledby="account-heading">
							<h3 id="account-heading" class="font-display text-lg">Compte</h3>
							<form class="flex flex-col gap-2">
								<fieldset class="flex flex-col gap-2">
									<legend class="mb-2 text-sm font-semibold">Pseudo</legend>
									<Label for="profile-username">Nom d’utilisateur</Label>
									<Input id="profile-username" autocomplete="username" minlength={3} maxlength={24} pattern="[a-zA-Z0-9]+" required class="bg-card" />
									<Button type="submit" variant="secondary" class="self-start">Enregistrer le pseudo</Button>
								</fieldset>
							</form>
							<Separator />
							<form class="flex flex-col gap-2">
								<fieldset class="flex flex-col gap-2">
									<legend class="mb-2 text-sm font-semibold">Mot de passe</legend>
									<Label for="current-password">Mot de passe actuel</Label>
									<Input id="current-password" type="password" autocomplete="current-password" required class="bg-card" />
									<Label for="new-password">Nouveau mot de passe</Label>
									<Input id="new-password" type="password" autocomplete="new-password" minlength={12} maxlength={128} required aria-describedby="password-hint" class="bg-card" />
									<small id="password-hint" class="text-xs text-muted-foreground">12 à 128 caractères. Les règles du serveur restent applicables.</small>
									<Label for="confirm-password">Confirmer le nouveau mot de passe</Label>
									<Input id="confirm-password" type="password" autocomplete="new-password" minlength={12} maxlength={128} required class="bg-card" />
									<Button type="submit" variant="secondary" class="self-start">Changer le mot de passe</Button>
								</fieldset>
							</form>
						</section>
						<div class="flex flex-col gap-4">
							<section class="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4" aria-labelledby="security-heading">
								<h3 id="security-heading" class="font-display text-lg">Double authentification · 2FA</h3>
								<p class="text-sm text-muted-foreground">Ajoute un code temporaire généré par ton application d’authentification à la connexion.</p>
							</section>
							<section class="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4" aria-labelledby="audio-heading">
								<h3 id="audio-heading" class="font-display text-lg">Ambiance sonore</h3>
							</section>
							<section class="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4" aria-labelledby="game-heading">
								<h3 id="game-heading" class="font-display text-lg">Confort de jeu</h3>
							</section>
						</div>
					</Card.Content>
					<Card.Footer class="flex items-center justify-between gap-3 border-t border-border">
						<Button variant="outline">Réinitialiser les préférences audio et jeu</Button>
						<small class="text-xs text-muted-foreground">Les réglages de compte et de sécurité sont conservés.</small>
					</Card.Footer>
				{/if}
			</Card.Root>
		{/if}
	</PageShell>
</Tabs.Root>
