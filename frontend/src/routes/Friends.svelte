<script lang="ts">
    import Search from "@lucide/svelte/icons/search";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import Ellipsis from "@lucide/svelte/icons/ellipsis";
    import Check from "@lucide/svelte/icons/check";
    import X from "@lucide/svelte/icons/x";
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
    import { friendManager } from '../utils/friend.svelte';
    import { token } from '$lib/auth';
    import { logout, authFetch } from '$lib/auth';
    import { onlineFriends, sendMessage, onNewMessage, type ChatMessage } from '$lib/socket';



    const sortedFriends = $derived(
    [...friendManager.friends].sort(
        (a, b) => Number(!!$onlineFriends[b.user.id]) - Number(!!$onlineFriends[a.user.id])
    )
);

    type Status = "Online" | "InGame" | "Afk";

    const statusStyle: Record<Status, { label: string; dot: string; text: string }> = {
        Online: { label: "En ligne", dot: "bg-emerald-500", text: "text-emerald-700" },
        InGame: { label: "En jeu", dot: "bg-sky-500", text: "text-sky-700" },
        Afk: { label: "Absent", dot: "bg-amber-500", text: "text-amber-700" },
    };

    let popup: "" | "message" | "add" = $state("");
    let showRequests = $state(false);

    const Friends_Test: { login: string; status: Status; avatar: string }[] = [
        { login: "Test_Online", status: "Online", avatar: "../assets/home/avatar/test-inline.png" },
        { login: "Test_InGame", status: "InGame", avatar: "../assets/home/avatar/test-afk.png" },
        { login: "Test_Afk", status: "Afk", avatar: "../assets/home/avatar/test-offline.png" },
    ];

    const Friends_Offline_Test = Array.from({ length: 9 }, () => ({
        login: "Test_Offline",
        avatar: "../assets/home/avatar/test-offline.png",
    }));

    let selectedValue = $state("");
    const selectedId = $derived(selectedValue ? Number(selectedValue) : null);
    const selected = $derived(
        friendManager.friends.find((f) => f.conversationId === selectedId)
    );
    let messages = $state<ChatMessage[]>([]);
let nextCursor = $state<string | null>(null);
let hasMore = $state(false);
let text = $state("");
let sendError = $state<string | null>(null);


$effect(() => {
    const id = selectedId;
    messages = [];
    nextCursor = null;
    hasMore = false;
    sendError = null;
    if (id === null) return;

    authFetch(`/api/conversations/${id}/messages?take=20`)
        .then((res) => res.json())
        .then((page) => {
            if (id !== selectedId) return;
            messages = page.items;
            nextCursor = page.nextCursor;
            hasMore = page.hasMore;
        })
        .catch(() => {});
});

$effect(() =>
    onNewMessage((msg) => {
        if (msg.conversationId !== undefined && msg.conversationId !== selectedId) return;
        if (messages.some((m) => m.id === msg.id)) return;
        messages = [...messages, msg];
    })
);

async function loadMore() {
    const id = selectedId;
    if (id === null || !hasMore || !nextCursor) return;
    const res = await authFetch(`/api/conversations/${id}/messages?take=20&cursor=${nextCursor}`);
    const page = await res.json();
    if (id !== selectedId) return;
    messages = [...page.items, ...messages];
    nextCursor = page.nextCursor;
    hasMore = page.hasMore;
}

async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (selectedId === null || !text.trim()) return;
    const res = await sendMessage(selectedId, text);
    if (res.ok) {
        text = "";
        sendError = null;
    } else {
        sendError = res.error;
    }
}
</script>


<aside class="grid h-full grid-rows-[15.5vh_minmax(0,1fr)_auto] overflow-hidden px-[5px] pt-[5px]">
    <section class="relative overflow-hidden">
        <img class="pointer-events-none absolute inset-0 size-full" src="../assets/home/background/profil-vide.png" alt="" />
        <div class="relative flex h-full items-center gap-[1vw] px-[1.3vw]">
            <div class="relative">
                <Avatar.Root class="size-[6vw] max-h-[11vh] max-w-[11vh] rounded-md after:rounded-md after:border-0">
                    <Avatar.Image src="../assets/home/avatar/avatar-kenshii.png" alt="0" class="rounded-md" />
                    <Avatar.Fallback>KE</Avatar.Fallback>
                </Avatar.Root>
                <Badge variant="secondary" class="absolute -bottom-2 left-1/2 -translate-x-1/2 border-2 border-accent px-2">42</Badge>
            </div>
            <div class="flex min-w-0 flex-col gap-1">
                <strong class="truncate text-xl text-secondary-foreground">{friendManager.username}</strong>
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
                    AMIS ({friendManager.friends.length})
                </div>
                {#each sortedFriends as f (f.user.id)}
                    {@const status = $onlineFriends[f.user.id] ? statusStyle.Online : null}
                    <Button variant="ghost" class="h-auto justify-start gap-3 px-2 py-1.5 hover:bg-accent/70">
                        <Avatar.Root class="size-10">
                            <Avatar.Image src={`/api/avatars/${f.user.avatarUrl ?? 'default.png'}`} alt={f.user.username} />
                            <Avatar.Fallback>{f.user.username.slice(0, 2)}</Avatar.Fallback>
                            {#if status}
                                <Avatar.Badge class={status.dot} />
                            {/if}
                        </Avatar.Root>
                        <span class="flex min-w-0 flex-1 flex-col items-start">
                            <strong class="truncate text-sm">{f.user.username}</strong>
                            <span class={cn("text-xs", status?.text ?? "text-muted-foreground")}>
                                {status?.label ?? "Hors ligne"}
                            </span>
                        </span>
                        <Ellipsis class="text-muted-foreground" aria-label="Options" />
                    </Button>
                {/each}

                <!--<div class="flex items-center gap-2 px-1 pt-3 text-xs font-bold tracking-widest text-muted-foreground">
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
                {/each}-->
            </div>
        </ScrollArea>

        <!-- Section des Demandes d'amis -->
<div class="flex flex-col gap-1">
    <Button 
        variant="outline" 
        class="justify-start gap-2 bg-card/60 font-bold tracking-widest"
        onclick={() => (showRequests = !showRequests)}
    >
        <ChevronRight class={cn("size-4 transition-transform duration-200", showRequests && "rotate-90")} />
        DEMANDES
        <Badge class="ml-auto">{friendManager.friend_requests.length}</Badge>
    </Button>

    {#if showRequests}
        <div class="flex flex-col gap-1 pl-2 pt-1">
            {#if friendManager.friend_requests.length === 0}
                <p class="py-2 text-center text-xs text-muted-foreground">Aucune demande en attente</p>
            {:else}
                {#each friendManager.friend_requests as req (req.user.id)}
                    <div class="flex items-center justify-between rounded-md bg-card/40 p-2 hover:bg-accent/50">
                        <div class="flex items-center gap-2 min-w-0">
                            <Avatar.Root class="size-8">
                                <Avatar.Image 
                                    src={req.user.avatarUrl ? `/api/avatars/${req.user.avatarUrl}` : "../assets/home/avatar/test-offline.png"} 
                                    alt={req.user.username} 
                                />
                                <Avatar.Fallback>{req.user.username.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                            </Avatar.Root>
                            <span class="truncate text-sm font-medium">{req.user.username}</span>
                        </div>
                        
                        <div class="flex items-center gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                class="size-7 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400"
                                title="Accepter"
                                onclick={() => friendManager.accept_request(req.user.id)}
                            >
                                <Check class="size-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                class="size-7 text-destructive hover:bg-destructive/20 hover:text-destructive"
                                title="Refuser"
                                onclick={() => friendManager.deny_request(req.user.id)}
                            >
                                <X class="size-4" />
                            </Button>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    {/if}
</div>
    </section>

    <footer class="relative h-[77px]">
        <img class="pointer-events-none absolute inset-0 size-full" src="../assets/home/background/social-footer-base.png" alt="" />
        <div class="relative flex h-full items-center justify-end gap-6 pr-6">
            <Button variant="ghost" size="icon-lg" class="size-12 hover:scale-110 hover:bg-secondary-foreground/10" aria-label="Messages" onclick={() => (popup = "message")}>
                <img class="size-8 object-contain" src="../assets/home/icone/message.png" alt="" />
            </Button>
            <span class="h-8 w-px bg-secondary-foreground/40"></span>
            <Button variant="ghost" size="icon-lg" class="size-12 hover:scale-110 hover:bg-secondary-foreground/10" aria-label="Ajouter un ami" onclick={() => (popup = "add")}>
                <img class="size-8 object-contain" src="../assets/home/icone/add-friend.png" alt="" />
            </Button>
            <span class="h-8 w-px bg-secondary-foreground/40"></span>
            <Button variant="ghost" size="icon-lg" class="size-12 hover:scale-110 hover:bg-secondary-foreground/10" aria-label="deconnexion" onclick={() => logout()}>
                <img class="size-8 object-contain brightness-0 invert-[.55]" src="../assets/Icone/connexion.png" alt="" />
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
                    <NativeSelect.Root id="conversation_contact" bind:value={selectedValue} class="w-full">
                    <NativeSelect.Option value="" disabled>Choisis un contact…</NativeSelect.Option>
                    {#each friendManager.friends as f (f.conversationId)}
                        <NativeSelect.Option value={String(f.conversationId)}>{f.user.username}</NativeSelect.Option>
                    {/each}
                </NativeSelect.Root>
                </div>
                {#if selected}
                    <div class="flex items-center justify-between">
                        <h3 class="font-display text-lg">{selected.user.username}</h3>
                        <Button variant="outline" size="sm">Actualiser</Button>
                    </div>
                    <div class="flex min-h-40 max-h-80 flex-col gap-2 overflow-y-auto rounded-md border border-border bg-muted/40 p-3"
                        aria-label="Historique des messages" aria-live="polite">
                        {#if hasMore}
                            <Button variant="outline" size="sm" onclick={loadMore}>Charger plus</Button>
                        {/if}
                        {#each messages as m (m.id)}
                            <div class={cn("max-w-[85%] rounded-md px-2 py-1 text-sm",
                                m.sender.username === friendManager.username
                                    ? "self-end bg-primary text-primary-foreground"
                                    : "self-start bg-card")}>
                                <strong class="block text-xs opacity-70">{m.sender.username}</strong>
                                {m.content}
                            </div>
                        {/each}
                    </div>
                    <form class="flex flex-col gap-2" onsubmit={submit}>
                        <Label for="message-text">Ton message</Label>
                        <Textarea id="message-text" bind:value={text} maxlength={1024} rows={3} placeholder="Écris ton message…" />
                        <Button type="submit" class="self-end">Envoyer</Button>
                        {#if sendError}<p class="text-sm text-destructive">{sendError}</p>{/if}
                    </form>
                {:else}
                    <p class="text-sm text-muted-foreground">Sélectionne un ami pour ouvrir sa conversation.</p>
                {/if}
            {:else if popup === "add"}
                <form class="flex flex-col gap-2" onsubmit={friendManager.add_friend}>
                    <Label for="contact_login">Pseudo du contact</Label>
                    <Input id="contact_login" maxlength={40} autocomplete="off" bind:value={friendManager.to_add}/>
                    <Button type="submit" class="self-end">Ajouter</Button>
                </form>
            {/if}
        </div>
    </Sheet.Content>
</Sheet.Root>