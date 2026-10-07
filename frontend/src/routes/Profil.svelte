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
	import { t, locale } from "$lib/i18n";
	import { navigate } from "$lib/router";
	import { onMount } from "svelte";
	import {profilManager} from '../utils/profil.svelte';

	type Section = "overview" | "achievements" | "customization" | "setting";
	type Achievement = { key: string; image: string; unlocked?: boolean; progress?: number };

	onMount(() => {
        profilManager.get_user();
    });

	let {
		onCustomize = () => {},
		player: playerProp,
	}: {
		onCustomize?: (section: "avatar" | "frame" | "title" | "name" | "all") => void;
		player?: { name: string; title: string; quote: string; level: number; xp: number; xpTarget: number; avatar: string };
	} = $props();

	const player = $derived(
		playerProp ?? { name: profilManager.username, title: $t("PROFILE.DEFAULT_TITLE"), quote: $t("PROFILE.DEFAULT_QUOTE"), level: 42, xp: 6500, xpTarget: 10000, avatar: "../assets/home/avatar/avatar-kenshii.png" }
	);

	const sections: { value: Section; label: string }[] = $derived([
		{ value: "overview", label: $t("PROFILE.SECTIONS.OVERVIEW") },
		{ value: "achievements", label: $t("PROFILE.SECTIONS.ACHIEVEMENTS") },
		{ value: "customization", label: $t("PROFILE.SECTIONS.CUSTOMIZATION") },
		{ value: "setting", label: $t("PROFILE.SECTIONS.SETTINGS") },
	]);

	let profileSection = $state<Section>("overview");

	const achievements: Achievement[] = [
		{ key: "FIRST_STEP", image: "../assets/home/avatar/dragon.png", unlocked: true },
		{ key: "TIGER_SPIRIT", image: "../assets/home/avatar/dragon.png", unlocked: true },
		{ key: "TEMPLE_WAY", image: "../assets/home/avatar/dragon.png", unlocked: true },
		{ key: "PERFECT_STREAK", image: "../assets/home/avatar/dragon.png", progress: 80 },
		{ key: "HUNDRED_WINS", image: "../assets/home/avatar/dragon.png", progress: 73 },
		{ key: "DOJO_MASTER", image: "../assets/home/avatar/dragon.png", progress: 0 },
		{ key: "DOJO_MASTER", image: "../assets/home/avatar/dragon.png", progress: 0 },
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
	<PageShell title={$t("PROFILE.TITLE")} subtitle={$t("PROFILE.SUBTITLE")}>
		{#snippet sidebar()}
			<SideNav label={$t("PROFILE.SECTIONS_LABEL")} items={sections} />
			<InkQuote class="mt-auto" quote={$t("PROFILE.QUOTE")} author="" stamp />
		{/snippet}

		<Card.Root class="shrink-0 bg-card/80 backdrop-blur-sm" aria-label={$t("PROFILE.IDENTITY")}>
			<Card.Content class="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-6">
				<div class="flex flex-col items-center gap-2">
					<div class="relative">
						<Avatar.Root class="size-24 border-4 border-secondary shadow-[0_0_0_2px_var(--accent)]">
							<Avatar.Image src={player.avatar} alt={$t("PROFILE.AVATAR_ALT", { values: { name: player.name } })} />
							<Avatar.Fallback>{player.name.slice(0, 2)}</Avatar.Fallback>
						</Avatar.Root>
						<Button size="icon-sm" class="absolute right-0 bottom-0 rounded-full" aria-label={$t("PROFILE.CHANGE_PHOTO")} onclick={() => onCustomize("avatar")}>
							<Camera />
						</Button>
					</div>
					<Button variant="outline" size="sm" onclick={() => onCustomize("avatar")}>{$t("PROFILE.CHANGE_AVATAR")}</Button>
				</div>
				
				<div class="flex min-w-0 flex-col gap-1">
					<h2 class="flex items-center gap-1 font-display text-3xl font-bold">
						{player.name}
						<Button variant="ghost" size="icon-sm" aria-label={$t("PROFILE.EDIT_NAME")} onclick={() => onCustomize("name")}><Pencil /></Button>
					</h2>
					<span class="flex items-center gap-1 text-sm font-semibold">
						{player.title}
						<Button variant="ghost" size="icon-xs" aria-label={$t("PROFILE.EDIT_TITLE")} onclick={() => onCustomize("title")}><Pencil /></Button>
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
							<strong class="text-xs tracking-widest">{$t("PROFILE.LEVEL")}</strong>
							<b class="text-sm text-primary">{levelProgress}%</b>
						</div>
						<Progress value={levelProgress} class="h-2" aria-label={$t("PROFILE.LEVEL_PROGRESS")} />
						<p class="text-xs text-muted-foreground">{player.xp.toLocaleString($locale ?? undefined)} / {player.xpTarget.toLocaleString($locale ?? undefined)} XP</p>
						<small class="text-xs text-muted-foreground">{$t("PROFILE.NEXT_LEVEL", { values: { level: player.level + 1 } })}</small>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		{#if showAchievements}
			<Card.Root class="shrink-0 bg-card/80 backdrop-blur-sm">
				<Card.Header>
					<Card.Title class="font-display text-lg">◒ {$t("PROFILE.ACHIEVEMENTS.HEADING")}</Card.Title>
					<Card.Action class="flex items-center gap-3 text-sm">
						<b>{$t("PROFILE.ACHIEVEMENTS.UNLOCKED", { values: { count: unlockedCount, total: achievements.length } })}</b>
						{#if profileSection !== "achievements"}
							<Button variant="link" size="sm" class="px-0" onclick={() => (profileSection = "achievements")}>{$t("PROFILE.ACHIEVEMENTS.SEE_ALL")} ›</Button>
						{/if}
					</Card.Action>
				</Card.Header>
				<Card.Content class="grid grid-cols-3 gap-3">
					{#each visibleAchievements as achievement, index (index)}
						{@const locked = !achievement.unlocked && achievement.progress === 0}
						<div class={cn("relative flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 transition-transform hover:-translate-y-0.5", locked && "opacity-55 grayscale")}>
							<img class="size-12 shrink-0 object-contain" src={achievement.image} alt="" />
							<div class="flex min-w-0 flex-1 flex-col gap-1">
								<h3 class="truncate font-semibold">{$t(`PROFILE.ACHIEVEMENTS.ITEMS.${achievement.key}.TITLE`)}</h3>
								<p class="text-xs text-muted-foreground">{$t(`PROFILE.ACHIEVEMENTS.ITEMS.${achievement.key}.DESCRIPTION`)}</p>
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
					<Card.Title class="font-display text-lg">◒ {$t("PROFILE.CUSTOMIZATION.HEADING")}</Card.Title>
				</Card.Header>
				<Card.Content class="grid grid-cols-4 gap-3">
					<Button variant="outline" class="h-auto justify-start gap-3 bg-transparent p-3 whitespace-normal" onclick={() => onCustomize("avatar")}>
						<img class="size-12 rounded-full object-cover" src={player.avatar} alt="" />
						<span class="flex flex-col items-start text-left"><b>{$t("PROFILE.CUSTOMIZATION.AVATAR")}</b><small class="text-xs text-muted-foreground">{$t("PROFILE.CUSTOMIZATION.AVATAR_HINT")}</small></span>
					</Button>
					<Button variant="outline" class="h-auto justify-start gap-3 bg-transparent p-3 whitespace-normal" onclick={() => onCustomize("frame")}>
						<span class="size-12 shrink-0 rounded-full border-4 border-double border-primary"></span>
						<span class="flex flex-col items-start text-left"><b>{$t("PROFILE.CUSTOMIZATION.FRAME")}</b><small class="text-xs text-muted-foreground">{$t("PROFILE.CUSTOMIZATION.FRAME_HINT")}</small></span>
					</Button>
					<Button variant="outline" class="h-auto justify-start gap-3 bg-transparent p-3 whitespace-normal" onclick={() => onCustomize("title")}>
						<span class="shrink-0 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground">{player.title}</span>
						<span class="flex flex-col items-start text-left"><b>{$t("PROFILE.CUSTOMIZATION.TITLE")}</b><small class="text-xs text-muted-foreground">{$t("PROFILE.CUSTOMIZATION.TITLE_HINT")}</small></span>
					</Button>
					<div class="flex flex-col items-center justify-center gap-2">
						<Button variant="secondary" onclick={() => onCustomize("all")}>{$t("PROFILE.CUSTOMIZATION.CUSTOMIZE")}</Button>
						<InkQuote quote={$t("PROFILE.CUSTOMIZATION.QUOTE")} />
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		{#if showSettings}
			<Card.Root class="shrink-0 bg-card/80 backdrop-blur-sm" aria-label={$t("PROFILE.SETTINGS.HEADING")}>
				<Card.Header>
					<Card.Title class="font-display text-lg">◒ {$t("PROFILE.SETTINGS.HEADING")}</Card.Title>
					<Card.Description>{$t("PROFILE.SETTINGS.DESCRIPTION")}</Card.Description>
				</Card.Header>
				{#if profileSection === "overview"}
					<Card.Content class="flex items-center justify-between gap-3">
						<p class="text-sm">{$t("PROFILE.SETTINGS.SUMMARY")}</p>
						<Button variant="secondary" onclick={() => (profileSection = "setting")}>{$t("PROFILE.SETTINGS.OPEN")}</Button>
					</Card.Content>
				{:else}
					<Card.Content class="grid grid-cols-2 gap-4">
						<section class="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4" aria-labelledby="account-heading">
							<h3 id="account-heading" class="font-display text-lg">{$t("PROFILE.SETTINGS.ACCOUNT")}</h3>
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
									<legend class="mb-2 text-sm font-semibold">{$t("PROFILE.SETTINGS.NICKNAME")}</legend>
									<Label for="profile-username">{$t("PROFILE.SETTINGS.USERNAME")}</Label>
									<Input id="profile-username" autocomplete="username" minlength={3} maxlength={24} pattern="[a-zA-Z0-9]+" required class="bg-card" bind:value={profilManager.newusername}/>
									<Button type="submit" variant="secondary" class="self-start">{$t("PROFILE.SETTINGS.SAVE_USERNAME")}</Button>
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
									<legend class="mb-2 text-sm font-semibold">{$t("PROFILE.SETTINGS.PASSWORD")}</legend>
									<Label for="current-password">{$t("PROFILE.SETTINGS.CURRENT_PASSWORD")}</Label>
									<Input id="current-password" type="password" autocomplete="current-password" required class="bg-card" bind:value={profilManager.oldpassword} />
									<Label for="new-password">{$t("PROFILE.SETTINGS.NEW_PASSWORD")}</Label>
									<Input id="new-password" type="password" autocomplete="new-password" minlength={12} maxlength={128} required aria-describedby="password-hint" class="bg-card" bind:value={profilManager.newpassword1}/>
									<small id="password-hint" class="text-xs text-muted-foreground">{$t("PROFILE.SETTINGS.PASSWORD_HINT")}</small>
									<Label for="confirm-password">{$t("PROFILE.SETTINGS.CONFIRM_PASSWORD")}</Label>
									<Input id="confirm-password" type="password" autocomplete="new-password" minlength={12} maxlength={128} required class="bg-card" bind:value={profilManager.newpassword2}/>
									<Button type="submit" variant="secondary" class="self-start">{$t("PROFILE.SETTINGS.CHANGE_PASSWORD")}</Button>
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
								<h3 id="security-heading" class="font-display text-lg">{$t("PROFILE.SETTINGS.TWOFA.HEADING")}</h3>
								<p class="text-sm text-muted-foreground">{$t("PROFILE.SETTINGS.TWOFA.SCAN")}</p>
								<div class="flex justify-center p-2 bg-white rounded-md w-fit self-center">
									<img src={profilManager.qr_image} alt={$t("PROFILE.SETTINGS.TWOFA.QR_ALT")} class="size-48" />
								</div>
								<form class="flex flex-col gap-2" onsubmit={(e) => profilManager.validat_two_fa(e)}>
									<Label for="two-fa-code">{$t("PROFILE.SETTINGS.TWOFA.CODE")}</Label>
									<Input id="two-fa-code" type="text" class="bg-card" bind:value={profilManager.qr_code}/>
									<Button type="submit" variant="secondary" class="self-start mt-2">{$t("PROFILE.SETTINGS.TWOFA.VALIDATE")}</Button>
									{#if profilManager.two_fa}
										<p class="text-sm text-destructive">{translateError(profilManager.two_fa)}</p>
									{/if}
								</form>
							</section>

						{:else if !profilManager.is_2fa_enabled}
							<section class="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4" aria-labelledby="security-heading">
								<h3 id="security-heading" class="font-display text-lg">{$t("PROFILE.SETTINGS.TWOFA.HEADING")}</h3>
								<p class="text-sm text-muted-foreground">{$t("PROFILE.SETTINGS.TWOFA.PROTECT")}</p>
								<Button type="button" class="text-sm self-start" onclick={() => profilManager.active_two_fa()}>{$t("PROFILE.SETTINGS.TWOFA.ENABLE")}</Button>
								{#if profilManager.two_fa}
									<p class="text-sm text-destructive">{translateError(profilManager.two_fa)}</p>
								{/if}
							</section>

						{:else}
							<section class="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4" aria-labelledby="security-heading">
								<h3 id="security-heading" class="font-display text-lg">{$t("PROFILE.SETTINGS.TWOFA.HEADING")}</h3>
								<p class="text-sm text-emerald-600 font-medium">✓ {$t("PROFILE.SETTINGS.TWOFA.ENABLED")}</p>
								<form class="flex flex-col gap-2" onsubmit={(e) => profilManager.delite_two_fa(e)}>
									<Label for="two-fa-code-disable">{$t("PROFILE.SETTINGS.TWOFA.DISABLE_LABEL")}</Label>
									<Input id="two-fa-code-disable" type="text" class="bg-card" bind:value={profilManager.qr_code}/>
									<Button type="submit" variant="destructive" class="text-sm self-start mt-1">
										{$t("PROFILE.SETTINGS.TWOFA.DISABLE")}
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
						<Button variant="outline">{$t("PROFILE.SETTINGS.RESET")}</Button>
						<small class="text-xs text-muted-foreground">{$t("PROFILE.SETTINGS.RESET_HINT")}</small>
					</Card.Footer>
				{/if}
			</Card.Root>
		{/if}
	</PageShell>
</Tabs.Root>
