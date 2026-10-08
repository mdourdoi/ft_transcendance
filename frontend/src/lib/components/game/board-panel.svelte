<script lang="ts">
    import Plateau from './plateau.svelte';
    import type { GameMap, Position } from '$lib/game/index';
    import { t } from '$lib/i18n';
    import { GAME_ASSETS, paint } from './assets';

    let {
        map,
        flipped,
        selected,
        destinations,
        disabled,
        waiting,
        status,
        cancellable,
        oncell,
        oncancel
    }: {
        map: GameMap;
        flipped: boolean;
        selected: Position | null;
        destinations: Position[];
        disabled: boolean;
        waiting: boolean;
        status: string;
        cancellable: boolean;
        oncell: (position: Position) => void;
        oncancel: () => void;
    } = $props();
</script>

<section aria-label={$t('GAME.BOARD')} class="asset-fill relative order-4 mx-auto aspect-square w-full max-w-[70dvh] bg-[#eed7b4] shadow-xl lg:absolute lg:left-[34%] lg:top-[17%] lg:aspect-auto lg:h-[51%] lg:w-[34%] lg:max-w-none" style={paint('board-frame')}>
    <div class="absolute inset-x-0 top-[1%] flex h-[6%] items-center justify-center gap-3 text-sm uppercase tracking-[.25em]"><span class="h-2 w-2 rounded-full" class:bg-red-800={!flipped} class:bg-[#211b16]={flipped}></span>{$t('GAME.NORTH')}</div>
    <div class="absolute inset-[8%]">
        <Plateau assetBase={GAME_ASSETS} {map} {flipped} {selected} {destinations} {disabled} {oncell} />
        {#if waiting}
            <div role="status" class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#211b16]/75 text-center text-[#f2dec2]">
                <span class="h-8 w-8 rounded-full border-4 border-[#f2dec2]/30 border-t-[#f2dec2] motion-safe:animate-spin" aria-hidden="true"></span>
                <p class="text-[clamp(14px,1.3cqw,22px)] italic">{status}</p>
                {#if cancellable}
                    <button type="button" class="border border-[#bc965d] px-3 py-1 text-sm" onclick={oncancel}>{$t('COMMON.CANCEL')}</button>
                {/if}
            </div>
        {/if}
    </div>
    <div class="absolute inset-x-0 bottom-[1%] flex h-[6%] items-center justify-center gap-3 text-sm uppercase tracking-[.25em]"><span class="h-2 w-2 rounded-full" class:bg-red-800={flipped} class:bg-[#211b16]={!flipped}></span>{$t('GAME.SOUTH')}</div>
</section>

<style>
    button {
        cursor:pointer;
    }
    button:focus-visible {
        outline:3px solid #278978;outline-offset:3px;
    }
</style>
