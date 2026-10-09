<script lang="ts">
    import { fly } from 'svelte/transition';
    import MoveCard from './move-card.svelte';
    import type { Card } from '$lib/game/card';
    import { t } from '$lib/i18n';
    import { GAME_ASSETS, paint } from './assets';

    let {
        owner,
        name,
        avatar,
        clock,
        cards,
        flipped,
        active,
        playable,
        opponent,
        cardIndex,
        onselect
    }: {
        owner: number;
        name: string;
        avatar: string;
        clock: string;
        cards: Card[];
        flipped: boolean;
        active: boolean;
        playable: boolean;
        opponent: boolean;
        cardIndex: number;
        onselect: (index: number) => void;
    } = $props();
</script>

<section aria-label={$t('GAME.PLAYER', { values: { name } })} class="asset-fill flex flex-row items-center gap-3 px-4 py-3 drop-shadow-lg max-lg:rounded-md max-lg:border-[3px] max-lg:border-double max-lg:border-[#6b4a2b] max-lg:bg-[#f4dfbc] max-lg:bg-none! lg:absolute lg:top-[17%] lg:h-[46%] lg:w-[17%] lg:flex-col lg:items-stretch lg:gap-0 lg:p-[1.35%]" style={paint('player-panel')} style:left={owner === 1 ? '16%' : '69%'} style:order={owner === (flipped ? 1 : 0) ? 5 : 3}>
    <div class="flex min-w-0 flex-1 flex-col lg:contents">
        <div class="flex min-h-0 items-center gap-[6%] lg:h-[21%]">
            <div class="relative aspect-square w-12 shrink-0 lg:w-[30%]">
                <img src={avatar} alt="" class="h-full w-full rounded-full object-cover" />
                <img src="../assets/game/ui/avatar-ring.svg" alt="" class="pointer-events-none absolute inset-0 h-full w-full" />
            </div>
            <div class="min-w-0">
                <h2 class="line-clamp-2 text-[clamp(14px,1.2cqw,22px)] leading-tight font-bold break-all" title={name}>{name}</h2>
                <p class="mt-1 text-[clamp(11px,.85cqw,16px)]">{$t((owner === 1) !== flipped ? 'GAME.NORTH' : 'GAME.SOUTH')} · {$t(owner === 1 ? 'GAME.RED' : 'GAME.BLACK')}</p>
            </div>
        </div>
        <div class="ink-banner relative isolate my-[3%] flex min-h-[56px] shrink-0 items-center justify-center gap-3 text-[clamp(25px,2.2cqw,39px)] leading-none tabular-nums lg:h-[18%] lg:min-h-[65px]" aria-label={$t('GAME.CLOCK', { values: { name, time: clock } })}>
            <svg viewBox="0 0 400 150" preserveAspectRatio="none" aria-hidden="true" class="absolute inset-0 -z-10 h-full w-full fill-[#191713]"><path d="M38 70C30 42 62 22 104 24c30 1 44-12 82-10 34 2 52 12 88 8 44-5 86 8 92 40 5 26-14 44-48 50-30 5-50-4-84 4-36 8-66 14-106 6-34-7-46-4-70-18C40 94 42 84 38 70Z"/><path d="M96 26c-8-10-4-18 6-20 6 8 4 16-6 20ZM300 122c10 6 12 16 4 22-8-6-10-14-4-22ZM356 44c12-8 22-6 26 2-8 8-18 8-26-2Z"/><circle cx="22" cy="48" r="6"/><circle cx="13" cy="94" r="4"/><circle cx="388" cy="98" r="7"/><circle cx="352" cy="130" r="4"/><circle cx="60" cy="130" r="5"/><circle cx="200" cy="141" r="3"/><circle cx="330" cy="9" r="3"/><circle cx="44" cy="22" r="3"/></svg>
            <img src="../assets/game/icons/clock.svg" alt="" class="h-[1.8cqw] min-h-5 w-[1.8cqw] min-w-5 brightness-0 invert" />{clock}
        </div>
        <p class="ink-banner mb-[3%] flex min-h-7 shrink-0 items-center justify-center text-center text-[clamp(11px,.95cqw,17px)] lg:h-[10%] lg:min-h-0 {active ? 'motion-safe:animate-pulse' : ''}" style={paint('brush-black')}>{$t(!active ? 'GAME.CARDS_IN_HAND' : opponent ? 'GAME.OPPONENT_TURN' : 'GAME.YOUR_TURN')}</p>
    </div>
    <div class="grid h-36 w-40 shrink-0 grid-cols-2 gap-[5%] lg:h-auto lg:min-h-0 lg:w-auto lg:flex-1 lg:shrink">
        {#each cards as handCard, i (handCard.name)}
            <div class="h-full min-h-0" in:fly={{y:-18,duration:320}}>
                <MoveCard assetBase={GAME_ASSETS} card={handCard} player={flipped ? 1 - owner : owner} selected={playable && cardIndex === i} disabled={!playable} onclick={() => onselect(i)} />
            </div>
        {/each}
    </div>
</section>
