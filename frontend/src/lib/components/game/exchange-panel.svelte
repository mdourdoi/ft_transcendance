<script lang="ts">
    import { scale } from 'svelte/transition';
    import MoveCard from './move-card.svelte';
    import type { Card } from '$lib/game/card';
    import { t } from '$lib/i18n';
    import { GAME_ASSETS, paint } from './assets';

    let { card, player }: { card: Card | null; player: number } = $props();
</script>

<section aria-label={$t('GAME.EXCHANGE_LABEL')} class="exchange-panel order-7 flex h-44 w-full flex-col items-center lg:absolute lg:left-[32%] lg:top-[70%] lg:h-[23%] lg:w-[38%]">
    <h2 class="ink-banner mb-[2%] w-[67%] py-[2%] text-center text-[clamp(12px,1.05cqw,19px)]" style={paint('brush-black')}>{$t('GAME.EXCHANGE_TITLE')}</h2>
    <div class="flex min-h-0 w-full flex-1 items-center justify-center gap-[6%]">
        <img src="../assets/game/ui/card-back.svg" alt="" aria-hidden="true" class="h-[87%] w-[22%] -rotate-3 object-fill shadow-md" />
        <div class="h-full w-[22%] h-[35%]">
            {#if card}
                {#key card.name}
                    <div class="h-full" in:scale={{start:.7,duration:320}}>
                        <MoveCard assetBase={GAME_ASSETS} {card} {player} disabled />
                    </div>
                {/key}
            {/if}
        </div>
        <img src="../assets/game/ui/card-back.svg" alt="" aria-hidden="true" class="h-[87%] w-[22%] rotate-3 object-fill shadow-md" />
    </div>
</section>
