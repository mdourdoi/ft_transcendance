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
	import { t } from "$lib/i18n";
	import { navigate } from "$lib/router";
	import { onMount } from "svelte";
	import {profilManager} from '../utils/profil.svelte';

	type Section = "overview" | "achievements" | "customization" | "setting";
	type Achievement = { title: string; description: string; image: string; unlocked?: boolean; progress?: number };

	onMount(() => {
        profilManager.get_user();
    });

	let {
		onCustomize = () => {},
		player = { name: profilManager.username, title: "Disciple du vent", quote: "Le calme est ma force.", level: 42, xp: 6500, xpTarget: 10000, avatar: "../assets/home/avatar/avatar-kenshii.png" },
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



	function translateError(code: string): string {
		return $t(`ERRORS.${code}`, { default: code });
	}
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
							<div class="flex flex-col gap-2">
								<span class="text-sm font-semibold">{$t("EMAIL_VERIFY.LABEL")}</span>
								<p class="text-sm text-muted-foreground">{profilManager.email}</p>
								{#if profilManager.email_verified}
									<p class="text-sm font-medium text-emerald-600">✓ {$t("EMAIL_VERIFY.VERIFIED")}</p>
								{:else}
									<p class="text-sm text-muted-foreground">{$t("EMAIL_VERIFY.HINT")}</p>
									<Button variant="secondary" class="self-start" onclick={() => profilManager.request_email_verification()}>{$t("EMAIL_VERIFY.SEND")}</Button>
									{#if profilManager.email_status}
										<p role="status" class="text-sm font-medium text-emerald-600">{$t(`EMAIL_VERIFY.${profilManager.email_status}`)}</p>
									{/if}
									{#if profilManager.error_email}
										<p role="alert" class="text-sm text-destructive">{translateError(profilManager.error_email)}</p>
									{/if}
								{/if}
							</div>
							<Separator />
							<form class="flex flex-col gap-2" onsubmit={(e) => profilManager.change_username(e)}>
								<fieldset class="flex flex-col gap-2">
									<legend class="mb-2 text-sm font-semibold">Pseudo</legend>
									<Label for="profile-username">Nom d’utilisateur</Label>
									<Input id="profile-username" autocomplete="username" minlength={3} maxlength={24} pattern="[a-zA-Z0-9]+" required class="bg-card" bind:value={profilManager.newusername}/>
									<Button type="submit" variant="secondary" class="self-start">Enregistrer le pseudo</Button>
									{#if profilManager.error_username}
										<p role="alert" class="text-sm text-destructive">
											{translateError(profilManager.error_username)}
										</p>
									{/if}
								</fieldset>
							</form>
							<Separator />
							<form class="flex flex-col gap-2"onsubmit={(e) => profilManager.change_password(e)}>
								<fieldset class="flex flex-col gap-2" >
									<legend class="mb-2 text-sm font-semibold">Mot de passe</legend>
									<Label for="current-password">Mot de passe actuel</Label>
									<Input id="current-password" type="password" autocomplete="current-password" required class="bg-card" bind:value={profilManager.oldpassword} />
									<Label for="new-password">Nouveau mot de passe</Label>
									<Input id="new-password" type="password" autocomplete="new-password" minlength={12} maxlength={128} required aria-describedby="password-hint" class="bg-card" bind:value={profilManager.newpassword1}/>
									<small id="password-hint" class="text-xs text-muted-foreground">12 à 128 caractères. Les règles du serveur restent applicables.</small>
									<Label for="confirm-password">Confirmer le nouveau mot de passe</Label>
									<Input id="confirm-password" type="password" autocomplete="new-password" minlength={12} maxlength={128} required class="bg-card" bind:value={profilManager.newpassword2}/>
									<Button type="submit" variant="secondary" class="self-start">Changer le mot de passe</Button>
									{#if profilManager.error_password}
										<p role="alert" class="text-sm text-destructive">
											{translateError(profilManager.error_password)}
										</p>
									{/if}
								</fieldset>
							</form>
							<Separator />
							<Button variant="outline" class="self-start" onclick={() => navigate("/privacy", { useAnimation: true })}>{$t("PRIVACY.TITLE")}</Button>
						</section>
						<div class="flex flex-col gap-4">
						{#if profilManager.qr_image !== '' && !profilManager.is_2fa_enabled}
							<section class="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4" aria-labelledby="security-heading">
								<h3 id="security-heading" class="font-display text-lg">Double authentification · 2FA</h3>
								<p class="text-sm text-muted-foreground">Scannez ce QR code avec votre application d'authentification :</p>
								<div class="flex justify-center p-2 bg-white rounded-md w-fit self-center">
									<img src={profilManager.qr_image} alt="Code QR pour la double authentification" class="size-48" />
								</div>
								<form class="flex flex-col gap-2" onsubmit={(e) => profilManager.validat_two_fa(e)}>
									<Label for="two-fa-code">Code 2FA</Label>
									<Input id="two-fa-code" type="text" class="bg-card" bind:value={profilManager.qr_code}/>
									<Button type="submit" variant="secondary" class="self-start mt-2">Valider</Button>
									{#if profilManager.two_fa}
										<p class="text-sm text-destructive">{translateError(profilManager.two_fa)}</p>
									{/if}
								</form>
							</section>

						{:else if !profilManager.is_2fa_enabled}
							<section class="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4" aria-labelledby="security-heading">
								<h3 id="security-heading" class="font-display text-lg">Double authentification · 2FA</h3>
								<p class="text-sm text-muted-foreground">Protégez votre compte avec la 2FA.</p>
								<Button type="button" class="text-sm self-start" onclick={() => profilManager.active_two_fa()}>Activer</Button>
								{#if profilManager.two_fa}
									<p class="text-sm text-destructive">{translateError(profilManager.two_fa)}</p>
								{/if}
							</section>

						{:else}
							<section class="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4" aria-labelledby="security-heading">
								<h3 id="security-heading" class="font-display text-lg">Double authentification · 2FA</h3>
								<p class="text-sm text-emerald-600 font-medium">✓ La double authentification est activée sur votre compte.</p>
								<form class="flex flex-col gap-2" onsubmit={(e) => profilManager.delite_two_fa(e)}>
									<Label for="two-fa-code-disable">Entrez votre code 2FA pour désactiver</Label>
									<Input id="two-fa-code-disable" type="text" class="bg-card" bind:value={profilManager.qr_code}/>
									<Button type="submit" variant="destructive" class="text-sm self-start mt-1">
										Désactiver
									</Button>
								</form>
								{#if profilManager.two_fa}
									<p class="text-sm text-destructive">{translateError(profilManager.two_fa)}</p>
								{/if}
							</section>
						{/if}
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
