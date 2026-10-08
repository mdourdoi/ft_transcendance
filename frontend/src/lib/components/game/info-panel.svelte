<script lang="ts">
    import { t } from '$lib/i18n';
    import { paint } from './assets';

    let {
        status,
        over,
        selecting,
        opponentAway,
        clockHint,
        canPass,
        canResign,
        error,
        onresult,
        onpass,
        onresign
    }: {
        status: string;
        over: boolean;
        selecting: boolean;
        opponentAway: boolean;
        clockHint: boolean;
        canPass: boolean;
        canResign: boolean;
        error: string;
        onresult: () => void;
        onpass: () => void;
        onresign: () => void;
    } = $props();
</script>

<section aria-live="polite" class="asset-fill order-6 flex flex-col justify-center p-5 text-[#f2dec2] drop-shadow-lg max-lg:rounded-md max-lg:border-[3px] max-lg:border-double max-lg:border-[#bc965d] max-lg:bg-[#211b16] max-lg:bg-none! lg:absolute lg:left-[76%] lg:top-[65%] lg:h-[30%] lg:w-[23%] lg:px-[2%] lg:py-[1.5%]" style={paint('info-panel')}>
    <h2 class="text-[clamp(17px,1.7cqw,29px)] italic leading-tight">{status}</h2>
    {#if over}
        <button type="button" class="ink-banner mt-3 self-start px-4 py-3" style={paint('brush-red')} onclick={onresult}>{$t('GAME.SHOW_RESULT')}</button>
    {:else}
        <p class="my-[3%] text-[clamp(12px,.95cqw,17px)] text-[#d4bea3]">{$t(selecting ? 'GAME.CHOOSE_DESTINATION' : 'GAME.CHOOSE_CARD')}</p>
        <div class="mb-[3%] h-px bg-[#a92324]"></div>
        <p class="text-[clamp(11px,.85cqw,16px)]"><span class="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-600"></span>{$t('GAME.VALID_MOVE')}</p>
        <p class="text-[clamp(11px,.85cqw,16px)]"><span class="mr-2 inline-block h-3 w-3 rounded-full bg-red-600"></span>{$t('GAME.CAPTURE')}</p>
        {#if opponentAway}
            <p role="status" class="mt-2 text-[clamp(10px,.75cqw,14px)] text-amber-300">{$t('GAME.OPPONENT_AWAY')}</p>
        {/if}
        {#if clockHint}
            <p class="mt-2 text-[clamp(10px,.75cqw,14px)] text-[#bda68b]">{$t('GAME.CLOCK_STARTS')}</p>
        {/if}
        {#if canPass}
            <button type="button" class="mt-2 border border-[#bc965d] px-2 py-1 text-xs" onclick={onpass}>{$t('GAME.PASS')}</button>
        {/if}
        {#if canResign}
            <button type="button" class="mt-2 self-start text-xs underline underline-offset-2 hover:text-white" onclick={onresign}>{$t('GAME.RESIGN')}</button>
        {/if}
    {/if}
    {#if error}
        <p role="alert" class="mt-1 text-xs text-red-300">{$t(`ERRORS.${error}`, { default: $t('ERRORS.FORBIDDEN_MOVE') })}</p>
    {/if}
</section>

<style>
    button {
        cursor:pointer;
    }
    button:focus-visible {
        outline:3px solid #278978;outline-offset:3px;
    }
</style>
