<script lang="ts">
    import { t } from '$lib/i18n';
    import { paint } from './assets';

    let {
        step,
        total,
        reviewing,
        onexit,
        onrules,
        onback,
        onforward,
        onlive
    }: {
        step: number;
        total: number;
        reviewing: boolean;
        onexit: () => void;
        onrules: () => void;
        onback: () => void;
        onforward: () => void;
        onlive: () => void;
    } = $props();
</script>

<nav aria-label={$t('GAME.MENU_LABEL')} class="order-2 flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-md bg-[#f4dfbc]/90 px-2 py-2 text-[clamp(14px,1.2cqw,22px)] shadow-sm lg:absolute lg:left-[1.5%] lg:top-[19%] lg:w-[12.5%] lg:flex-col lg:items-stretch lg:gap-[1.3cqw] lg:py-3">
    <button type="button" class="ink-banner px-4 py-1 text-left lg:py-[6%]" style={paint('brush-black')} onclick={onexit}>‹ {$t('COMMON.BACK')}</button>
    <span class="ink-banner hidden px-3 py-[6%] italic lg:block" style={paint('brush-red')}>{$t('GAME.IN_PROGRESS')}</span>
    <button type="button" class="text-left italic hover:text-red-800 lg:pl-3" onclick={onrules}>{$t('GAME.RULES')}</button>
    <div class="flex items-center justify-between gap-3 lg:gap-1 lg:border-t lg:border-[#80603e]/50 lg:pt-2">
        <button type="button" class="px-2 text-[1.4em] leading-none disabled:opacity-30" aria-label={$t('GAME.PREVIOUS_MOVE')} title={`${$t('GAME.PREVIOUS_MOVE')} (←)`} disabled={step === 0} onclick={onback}>‹</button>
        <span class="text-[.8em] tabular-nums" aria-live="polite">{$t('GAME.MOVE_COUNTER', { values: { step, total } })}</span>
        <button type="button" class="px-2 text-[1.4em] leading-none disabled:opacity-30" aria-label={$t('GAME.NEXT_MOVE')} title={`${$t('GAME.NEXT_MOVE')} (→)`} disabled={!reviewing} onclick={onforward}>›</button>
    </div>
    {#if reviewing}
        <button type="button" class="ink-banner px-3 py-[4%] text-[.8em]" style={paint('brush-red')} onclick={onlive}>{$t('GAME.BACK_TO_LIVE')}</button>
    {/if}
</nav>

<style>
    button {
        cursor:pointer;
    }
    button:focus-visible {
        outline:3px solid #278978;outline-offset:3px;
    }
</style>
