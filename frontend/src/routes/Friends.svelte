<script lang="ts">
	import Search from "@lucide/svelte/icons/search";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import Ellipsis from "@lucide/svelte/icons/ellipsis";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Badge } from "$lib/components/ui/badge";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import * as Avatar from "$lib/components/ui/avatar";
	import * as NativeSelect from "$lib/components/ui/native-select";
	import * as Sheet from "$lib/components/ui/sheet";
	import { cn } from "$lib/utils";

	type Friend = { id: string; login: string; status: string; avatar: string };
	type Status = "Online" | "InGame" | "Afk";

	const statusStyle: Record<Status, { label: string; dot: string; text: string }> = {
		Online: { label: "En ligne", dot: "bg-emerald-500", text: "text-emerald-700" },
		InGame: { label: "En jeu", dot: "bg-sky-500", text: "text-sky-700" },
		Afk: { label: "Absent", dot: "bg-amber-500", text: "text-amber-700" },
	};

	let friends: Friend[] = [];
	let popup: "" | "message" | "add" = $state("");
	let selectedId = $state("");

	const Friends_Test: { login: string; status: Status; avatar: string }[] = [
		{ login: "Test_Online", status: "Online", avatar: "../assets/home/avatar/test-inline.png" },
		{ login: "Test_InGame", status: "InGame", avatar: "../assets/home/avatar/test-afk.png" },
		{ login: "Test_Afk", status: "Afk", avatar: "../assets/home/avatar/test-offline.png" },
	];

	const Friends_Offline_Test = Array.from({ length: 9 }, () => ({
		login: "Test_Offline",
		avatar: "../assets/home/avatar/test-offline.png",
	}));

	const selected = $derived(friends.find((friend) => friend.id === selectedId));
</script>

<aside class="grid h-full grid-rows-[15.5vh_minmax(0,1fr)_auto] overflow-hidden px-[5px] pt-[5px]">
	<section class="relative overflow-hidden">
		<img class="pointer-events-none absolute inset-0 size-full" src="../assets/home/background/profil-vide.png" alt="" />
		<div class="relative flex h-full items-center gap-[1vw] px-[1.3vw]">
			<div class="relative">
				<Avatar.Root class="size-[6vw] max-h-[11vh] max-w-[11vh] rounded-md after:rounded-md after:border-0">
					<Avatar.Image src="../assets/home/avatar/avatar-kenshii.png" alt="Kenshii" class="rounded-md" />
					<Avatar.Fallback>KE</Avatar.Fallback>
				</Avatar.Root>
				<Badge variant="secondary" class="absolute -bottom-2 left-1/2 -translate-x-1/2 border-2 border-accent px-2">42</Badge>
			</div>
			<div class="flex min-w-0 flex-col gap-1">
				<strong class="truncate text-xl text-secondary-foreground">Kenshii</strong>
				<span class="flex items-center gap-2 text-sm text-emerald-400">
					<span class="size-2.5 rounded-full bg-emerald-500"></span>
					En ligne
				</span>
			</div>
		</div>
	</section>

	<section class="flex min-h-0 flex-col gap-3 p-2">
		<div class="relative">
			<Input type="text" placeholder="Rechercher un ami..." class="h-10 bg-card/70 pr-10" />
			<Button variant="ghost" size="icon" class="absolute top-1/2 right-1 -translate-y-1/2" aria-label="Rechercher">
				<Search />
			</Button>
		</div>

		<ScrollArea class="min-h-0 flex-1 pr-2">
			<div class="flex flex-col gap-1">
				<div class="flex items-center gap-2 px-1 pt-1 text-xs font-bold tracking-widest text-muted-foreground">
					<ChevronDown class="size-4" />
					AMIS ({Friends_Test.length}/{Friends_Offline_Test.length + Friends_Test.length})
				</div>
				{#each Friends_Test as friend (friend.login)}
					{@const status = statusStyle[friend.status]}
					<Button variant="ghost" class="h-auto justify-start gap-3 px-2 py-1.5 hover:bg-accent/70">
						<Avatar.Root class="size-10">
							<Avatar.Image src={friend.avatar} alt={friend.login} />
							<Avatar.Fallback>{friend.login.slice(0, 2)}</Avatar.Fallback>
							<Avatar.Badge class={status.dot} />
						</Avatar.Root>
						<span class="flex min-w-0 flex-1 flex-col items-start">
							<strong class="truncate text-sm">{friend.login}</strong>
							<span class={cn("text-xs", status.text)}>{status.label}</span>
						</span>
						<Ellipsis class="text-muted-foreground" aria-label="Options" />
					</Button>
				{/each}

				<div class="flex items-center gap-2 px-1 pt-3 text-xs font-bold tracking-widest text-muted-foreground">
					<ChevronDown class="size-4" />
					HORS LIGNE ({Friends_Offline_Test.length})
				</div>
				{#each Friends_Offline_Test as friend, index (index)}
					<Button variant="ghost" class="h-auto justify-start gap-3 px-2 py-1.5 opacity-60 hover:bg-accent/70 hover:opacity-100">
						<Avatar.Root class="size-10 grayscale">
							<Avatar.Image src={friend.avatar} alt={friend.login} />
							<Avatar.Fallback>{friend.login.slice(0, 2)}</Avatar.Fallback>
						</Avatar.Root>
						<span class="flex min-w-0 flex-col items-start">
							<strong class="truncate text-sm">{friend.login}</strong>
							<span class="text-xs text-muted-foreground">Hors ligne</span>
						</span>
					</Button>
				{/each}
			</div>
		</ScrollArea>

		<Button variant="outline" class="justify-start gap-2 bg-card/60 font-bold tracking-widest">
			<ChevronRight />
			DEMANDES
			<Badge class="ml-auto">1</Badge>
		</Button>
	</section>

	<footer class="relative h-[77px]">
		<img class="pointer-events-none absolute inset-0 size-full" src="../assets/home/background/social-footer-base.png" alt="" />
		<div class="relative flex h-full items-center justify-center gap-6">
			<Button variant="ghost" size="icon-lg" class="size-12 hover:scale-110 hover:bg-secondary-foreground/10" aria-label="Messages" onclick={() => (popup = "message")}>
				<img class="size-8 object-contain" src="../assets/home/icone/message.png" alt="" />
			</Button>
			<span class="h-8 w-px bg-secondary-foreground/40"></span>
			<Button variant="ghost" size="icon-lg" class="size-12 hover:scale-110 hover:bg-secondary-foreground/10" aria-label="Ajouter un ami" onclick={() => (popup = "add")}>
				<img class="size-8 object-contain" src="../assets/home/icone/add-friend.png" alt="" />
			</Button>
		</div>
	</footer>
</aside>

<Sheet.Root open={popup !== ""} onOpenChange={(open) => { if (!open) popup = ""; }}>
	<Sheet.Content side="right" class="gap-0 border-l-4 border-double border-border">
		<Sheet.Header class="border-b border-border">
			<span class="text-[10px] tracking-[0.3em] text-muted-foreground">ONITAMA · LE DOJO</span>
			<Sheet.Title class="font-display text-2xl">
				{popup === "add" ? "Ajouter un contact" : "Messagerie"}
			</Sheet.Title>
		</Sheet.Header>

		<div class="flex flex-col gap-4 p-4">
			{#if popup === "message"}
				<div class="flex flex-col gap-2">
					<Label for="conversation_contact">Choisir un ami</Label>
					<NativeSelect.Root id="conversation_contact" bind:value={selectedId} class="w-full">
						<NativeSelect.Option value="" disabled>Choisis un contact…</NativeSelect.Option>
						{#each friends as friend (friend.id)}
							<NativeSelect.Option value={friend.id}>{friend.login}</NativeSelect.Option>
						{/each}
					</NativeSelect.Root>
				</div>
				{#if selected}
					<div class="flex items-center justify-between">
						<h3 class="font-display text-lg">{selected.login}</h3>
						<Button variant="outline" size="sm">Actualiser</Button>
					</div>
					<div class="min-h-40 rounded-md border border-border bg-muted/40 p-3" aria-label="Historique des messages" aria-live="polite"></div>
					<form class="flex flex-col gap-2">
						<Label for="message-text">Ton message</Label>
						<Textarea id="message-text" maxlength={2000} rows={3} placeholder="Écris ton message…" />
						<Button type="submit" class="self-end">Envoyer</Button>
					</form>
				{:else}
					<p class="text-sm text-muted-foreground">Sélectionne un ami pour ouvrir sa conversation.</p>
				{/if}
			{:else if popup === "add"}
				<form class="flex flex-col gap-2">
					<Label for="contact_login">Pseudo du contact</Label>
					<Input id="contact_login" maxlength={40} autocomplete="off" />
					<Button type="submit" class="self-end">Ajouter</Button>
				</form>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
