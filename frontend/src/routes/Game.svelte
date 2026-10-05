<script lang="ts">
    import { onMount } from 'svelte';
    import Plateau from '../lib/components/game/plateau/Plateau.svelte';
    import MoveCard from '../lib/components/game/move/MoveCard.svelte';
    import { card, Position } from '../lib/components/game/game/index';
    import { createGame, legalMoves, canMove, playMove, passTurn } from '../lib/components/game/game/engine';
    import type { Player } from '../lib/components/game/game/engine';
    let { onexit, names=['RaiNeko','Kenshii'], assetBase='../assets/game/', logoSrc, avatars }: {onexit?:()=>void;names?:[string,string];assetBase?:string;logoSrc?:string;avatars?:[string,string]}=$props();
    let game = $state (createGame(['Tiger','Dragon','Crane','Cobra','Mantis'].map(card)));
    let selected = $state <Position | null> (null);
    let cardIndex = $state(0);
    let clocks = $state([600000,600000]);
    let started = $state(false);
    let modal = $state <'rules' | 'history' | 'settings' | 'resign' | 'exit' | null> (null);
    let error = $state('');
    let showHints = $state(true);
    let initialMinutes = $state(10);
    let dialog = $state <HTMLDialogElement>();
    let lastTick = 0;
    const destinations = $derived(selected && showHints ? legalMoves(game,selected,cardIndex) : []);
    const blocked = $derived(!game.result && !canMove(game));
    const status = $derived(game.result ? `${names[game.result.winner]} remporte la partie` : `À ${names[game.turn]} de jouer`);
    const players=[1,0] as const;
    function time(ms:number) {
        const seconds = Math.ceil(ms/1000);
        return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
    }
    function tick() {
        const now = performance.now();
        if (started && !game.result) {
            const elapsed = now - lastTick;
            const next = [...clocks];
            next[game.turn] = Math.max(0, next[game.turn] - elapsed);
            clocks = next;
            if (next[game.turn] === 0) game={...game, result:{winner:(1-game.turn) as Player, reason: 'temps'}};}lastTick = now;
    }
    onMount(()=> {
        lastTick = performance.now();
        const id = setInterval(tick,100);
        return() => clearInterval(id);
    });
    $effect(() => {
        if(modal && dialog) {
            const element = dialog;
            const previous = document.activeElement as HTMLElement  |null;
            element.showModal();
            return() => {
                element.close();
                previous?.focus();
            };
        }
    });
    function choose(pos:Position) {
        tick();
        if (game.result)
            return;
        error = '';
        if (game.map.entityAt(pos)?.belongsTo(game.turn)) {
            selected = selected?.equals(pos)?null:pos;
            return;
        }
        if (!selected)
            return;
        try {
            game = playMove(game, selected, pos, cardIndex);
            selected = null;
            cardIndex = 0;
            started = true;
            lastTick = performance.now();
        } catch(e) {
            error = (e as Error).message;
        }
    }
    function pass() {
        tick();
        if (game.result)
            return;
        try {
            game = passTurn(game, cardIndex);
            selected = null;
            cardIndex = 0;
            started = true;
            lastTick = performance.now();
        } catch(e) {
            error = (e as Error).message;
        }
    }
    function restart() {
        game = createGame();
        selected = null;
        cardIndex = 0;
        clocks = [initialMinutes*60000, initialMinutes*60000];
        started = false;
        error = '';
        modal = null;
        lastTick = performance.now();
    }
    function resign() {
        tick();
        if (!game.result)
            game = {...game,result:{winner:(1-game.turn) as Player,reason:'abandon'}};
        modal = null;
    }
</script>

<svelte:head>
    <title>Onitama · Partie locale</title>
    <meta name="description" content="Onitama : une partie locale à deux, dans un dojo à l'encre japonaise."/>
</svelte:head>

<main style="background-image: url('../assets/game/background/dojo.png')" class="bg-center bg-cover bg-repeat w-full overflow-x-auto font-serif text-[#241a12]">
    <div class="bg-[#211b16] px-4 py-2 text-center text-xs text-[#efd8b4] min-[1280px]:hidden">Vue de bureau — fais défiler horizontalement pour voir tout le dojo.</div>
    <div class="relative mx-auto aspect-[3/2] w-full min-w-[1280px] max-w-[1800px] isolate">
        <img src="../assets/game/decor/sakura.png" alt="" aria-hidden="true" draggable="false" class="pointer-events-none absolute -left-[2%] top-0 -z-10 w-[27%]" />
        <img src="../assets/game/decor/pagoda.png" alt="" aria-hidden="true" draggable="false" class="pointer-events-none absolute right-[2%] top-[8%] -z-10 w-[15%] opacity-80" />
        <img src="../assets/game/decor/ronin.png" alt="" aria-hidden="true" draggable="false" class="pointer-events-none absolute bottom-[9%] left-[2%] -z-10 h-[28%] w-[13%] object-contain" />
        <img src={logoSrc ?? "../assets/game/ui/onitama.png"} alt="Onitama" class="absolute left-[1%] top-[1%] h-[15%] w-[21%] object-contain" />
        <header class="absolute left-[39%] top-[3%] w-[26%] text-center">
            <h1 class="ink-banner py-[5%] text-[clamp(18px,1.65vw,29px)]" style="background-image: url('../assets/game/ui/brush-black.svg')">PARTIE LOCALE</h1>
            <p class="mt-1 text-[clamp(12px,1vw,17px)]">Un esprit calme, un mouvement juste.</p>
        </header>
        <div class="absolute right-[2%] top-[3%] flex gap-[1.5vw]">
            {#each [{icon:'history',label:'Historique',target:'history'},{icon:'flag',label:'Règles',target:'rules'},{icon:'settings',label:'Paramètres',target:'settings'},{icon:'exit',label:'Quitter',target:'exit'}] as item}
                <button type="button" onclick={()=>modal=item.target as typeof modal} aria-label={item.label} title={item.label} class="rounded-sm p-1 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-red-700">
                    <img src={`../assets/game/icons/${item.icon}.svg`} alt="" class="h-[2.2vw] max-h-10 min-h-6 w-[2.2vw] min-w-6" />
                </button>
            {/each}
        </div>
        <nav aria-label="Menu de la partie" class="absolute left-[1.5%] top-[19%] flex w-[12.5%] flex-col gap-[1.3vw] rounded-md bg-[#f4dfbc]/90 px-2 py-3 shadow-sm text-[clamp(14px,1.2vw,22px)]">
            <button type="button" class="ink-banner px-4 py-[6%] text-left" style="background-image: url('../assets/game/ui/brush-black.svg')" onclick={()=>modal='exit'}>‹ Retour</button>
            <span class="ink-banner px-3 py-[6%] italic" style="background-image: url('../assets/game/ui/brush-red.svg')">Partie en cours</span>
            <button type="button" class="pl-3 text-left italic hover:text-red-800" onclick={()=>modal='history'}>Historique</button>
            <button type="button" class="pl-3 text-left italic hover:text-red-800" onclick={()=>modal='rules'}>Règles du jeu</button>
            <button type="button" class="pl-3 text-left italic hover:text-red-800" onclick={()=>modal='settings'}>Paramètres</button>
        </nav>
        {#each players as owner}
            <section aria-label={`Joueur ${names[owner]}`} class="asset-fill absolute top-[17%] flex h-[46%] w-[17%] flex-col p-[1.35%] drop-shadow-lg" style="background-image: url('../assets/game/ui/player-panel.svg')" style:left={owner === 1 ? '16%' : '69%'}>
                <div class="flex h-[21%] min-h-0 items-center gap-[6%]">
                    <div class="relative aspect-square w-[40%] shrink-0">
                        <img src={avatars?.[owner] ?? `../assets/game/avatars/${owner === 1 ? 'ronin' : 'kunoichi'}.png`} alt="" class="h-full w-full rounded-full object-contain" />
                        <img src="../assets/game/ui/avatar-ring.svg" alt="" class="pointer-events-none absolute inset-0 h-full w-full" />
                    </div>
                    <div class="min-w-0">
                        <h2 class="truncate text-[clamp(16px,1.4vw,25px)] font-bold" title={names[owner]}>{names[owner]}</h2>
                        <p class="mt-1 text-[clamp(11px,.85vw,16px)]">{owner === 1 ?'Nord · Rouge':'Sud · Noir'}</p>
                    </div>
                </div>
                <div class="ink-banner my-[3%] flex h-[18%] min-h-[65px] shrink-0 items-center justify-center gap-3 text-[clamp(25px,2.2vw,39px)] leading-none tabular-nums" style="background-image: url('../assets/game/ui/brush.svg')" aria-label={`Temps de ${names[owner]} : ${time(clocks[owner])}`}>
                    <img src="../assets/game/icons/clock.svg" alt="" class="h-[1.8vw] min-h-5 w-[1.8vw] min-w-5 brightness-0 invert" />{time(clocks[owner])}
                </div>
                <p class="ink-banner mb-[3%] flex h-[10%] shrink-0 items-center justify-center text-center text-[clamp(11px,.95vw,17px)]" style="background-image: url('../assets/game/ui/brush-black.svg')">{game.turn === owner && !game.result?'À toi de jouer':'Cartes en main'}</p>
                <div class="grid min-h-0 flex-1 grid-cols-2 gap-[5%]">
                    {#each game.hands[owner] as handCard,i}
                        <MoveCard assetBase={assetBase.replace(/\/$/, '')} card={handCard} player={owner} selected={game.turn === owner && cardIndex === i && !game.result} disabled={game.turn !== owner || !!game.result} onclick={()=>{cardIndex=i;error='';}} />
                    {/each}
                </div>
            </section>
        {/each}
        <section aria-label="Plateau de jeu" class="asset-fill absolute left-[34%] top-[17%] h-[51%] w-[34%] bg-[#eed7b4] shadow-xl" style="background-image: url('../assets/game/ui/board-frame.svg')">
            <div class="absolute inset-x-0 top-[1%] flex h-[6%] items-center justify-center gap-3 text-sm tracking-[.25em]"><span class="h-2 w-2 rounded-full bg-red-800"></span>NORD</div>
            <div class="absolute inset-[8%]">
                <Plateau assetBase={assetBase.replace(/\/$/, '')} map={game.map} {selected} {destinations} disabled={!!game.result} oncell={choose} />
            </div>
            <div class="absolute inset-x-0 bottom-[1%] flex h-[6%] items-center justify-center gap-3 text-sm tracking-[.25em]"><span class="h-2 w-2 rounded-full bg-[#211b16]"></span>SUD</div>
        </section>
        <section aria-label="Carte en échange" class="exchange-panel absolute left-[32%] top-[70%] flex h-[23%] w-[38%] flex-col items-center">
            <h2 class="ink-banner mb-[2%] w-[67%] py-[2%] text-center text-[clamp(12px,1.05vw,19px)]" style="background-image: url('../assets/game/ui/brush-black.svg')">Carte du maître · Échange</h2>
            <div class="flex min-h-0 w-full flex-1 items-center justify-center gap-[6%]">
                <img src="../assets/game/ui/card-back.svg" alt="" aria-hidden="true" class="h-[87%] w-[22%] -rotate-3 object-fill shadow-md" />
                <div class="h-full w-[22%] h-[35%]">
                    <MoveCard assetBase={assetBase.replace(/\/$/, '')} card={game.side} player={game.turn} disabled />
                </div>
                <img src="../assets/game/ui/card-back.svg" alt="" aria-hidden="true" class="h-[87%] w-[22%] rotate-3 object-fill shadow-md" />
            </div>
        </section>
        <section aria-live="polite" class="asset-fill absolute left-[76%] top-[65%] flex h-[30%] w-[23%] flex-col justify-center px-[2%] py-[1.5%] text-[#f2dec2] drop-shadow-lg" style="background-image: url('../assets/game/ui/info-panel.svg')">
            <h2 class="text-[clamp(17px,1.7vw,29px)] italic leading-tight">{status}</h2>
            {#if game.result}
                <p class="my-3 text-[clamp(12px,1vw,17px)]">{({capture:'Le maître adverse a été capturé.',temple:'Le temple adverse a été atteint.',abandon:'Victoire par abandon.',temps:'Le temps adverse est écoulé.'})[game.result.reason]}</p>
                <button type="button" class="ink-banner px-4 py-3" style="background-image: url('../assets/game/ui/brush-red.svg')" onclick={restart}>Nouvelle partie</button>
            {:else}
                <p class="my-[5%] text-[clamp(12px,.95vw,17px)] text-[#d4bea3]">{selected?'Choisis une destination valide.':'Choisis une carte, puis une de tes pièces.'}</p>
                <div class="mb-[5%] h-px bg-[#a92324]"></div>
                <p class="text-[clamp(11px,.85vw,16px)]"><span class="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-600"></span>Déplacement valide</p>
                <p class="text-[clamp(11px,.85vw,16px)]"><span class="mr-2 inline-block h-3 w-3 rounded-full bg-red-600"></span>Capture possible</p>
                {#if !started}
                    <p class="mt-2 text-[clamp(10px,.75vw,14px)] text-[#bda68b]">Le chrono démarre au premier coup.</p>
                {/if}
                {#if blocked}
                    <button type="button" class="mt-2 border border-[#bc965d] px-2 py-1 text-xs" onclick={pass}>Passer et échanger</button>
                {/if}
                <button type="button" class="mt-2 self-start text-xs underline underline-offset-2 hover:text-white" onclick={()=>modal='resign'}>Abandonner</button>
            {/if}
            {#if error}
                <p role="alert" class="mt-1 text-xs text-red-300">{error}</p>
            {/if}
        </section>
        <footer class="absolute bottom-[3%] left-[26%] w-[50%] rounded bg-[#f3e3c8]/90 py-1 text-center text-[clamp(10px,.8vw,15px)] uppercase tracking-[.2em]">Onitama — Un chemin de discipline, une victoire d’esprit</footer>
    </div>
</main>

{#if modal}
    <dialog bind:this={dialog} oncancel={(event)=>{event.preventDefault();modal=null;}} aria-labelledby="modal-title" style="background-image: url('../assets/game/ui/parchment.svg')" class="border-[5px] border-double border-[#80603e] fixed inset-0 m-auto max-h-[85dvh] w-[min(560px,92vw)] overflow-y-auto p-7 text-[#241a10] backdrop:bg-black/60">
        <header class="mb-5 flex items-center justify-between gap-5">
            <h2 id="modal-title" class="text-2xl">{({rules:'Règles du dojo',history:'Historique de la partie',settings:'Paramètres',resign:'Abandonner la partie ?',exit:'Quitter le dojo ?'})[modal]}</h2>
            <button onclick={()=>modal=null} aria-label="Fermer" class="text-3xl">×</button>
        </header>
        {#if modal==='rules'}
            <ol class="space-y-3 pl-5">
                <li>Deux joueurs partagent cet écran. Sud joue les pièces noires, Nord les rouges.</li>
                <li>Sélectionne une carte puis une de tes pièces. Les points indiquent les destinations possibles.</li>
                <li>Les mini-grilles sont orientées comme le plateau : celles du Nord sont retournées. Le carré sombre représente ta pièce.</li>
                <li>Une pièce ennemie sur la destination est capturée. Tu ne peux pas prendre tes propres pièces.</li>
                <li>La carte jouée est échangée avec celle du centre, puis le tour change.</li>
                <li>Gagne en capturant le maître adverse ou en amenant ton maître dans le temple adverse.</li>
                <li>Si aucun coup n’est possible avec tes deux cartes, tu dois passer et échanger une carte.</li>
            </ol>
        {:else if modal==='history'}
            {#if !game.history.length}
                <p>Aucun coup joué.</p>
            {:else}
                <ol class="list-decimal space-y-2 pl-6">
                    {#each game.history as move}
                        <li>{move}</li>
                    {/each}
                </ol>
            {/if}
        {:else if modal==='settings'}
            <label class="flex items-center gap-3"><input type="checkbox" bind:checked={showHints}/>Afficher les destinations possibles</label>
            <label class="mt-5 block">Durée de la prochaine partie
                <select bind:value={initialMinutes} class="ml-2 border p-1">
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                </select>
            </label>
            <p class="mt-4 text-sm">La durée choisie s’appliquera à la prochaine partie. Les chronomètres continuent pendant l’ouverture des menus.</p>
        {:else if modal==='resign'}
            <p>{names[game.turn]}, ton adversaire remportera la partie.</p>
            <button class="ink-banner mt-5 bg-red-800 px-5 py-2" onclick={resign}>Confirmer l’abandon</button>
        {:else}
            {#if onexit}
                <p>La partie locale ne sera pas sauvegardée.</p>
                <button class="ink-banner mt-5 px-5 py-2" onclick={()=>{modal=null;onexit?.();}}>Retour au launcher</button>
            {:else}
                <p>Route retour a faire</p>
            {/if}
        {/if}
    </dialog>
{/if}

<style>
    .asset-fill, .ink-banner {
        background-size:100% 100%;
        background-position:center;
        background-repeat:no-repeat;
    }
    .ink-banner {
        color:#f6e5cc;
    }
    dialog .ink-banner {
        background:#211b16;
    }
    button {
        cursor:pointer;
    }
    button:focus-visible {
        outline:3px solid #278978;outline-offset:3px;
    }
</style>
