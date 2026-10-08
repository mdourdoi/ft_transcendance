<script lang="ts">
    import { onMount } from 'svelte';
    import { t } from '$lib/i18n';
    import { paint, type Modal } from './assets';

    let {
        modal,
        title,
        outcome,
        reason,
        resignName,
        online,
        playing,
        onclose,
        onrestart,
        onresign,
        onquit
    }: {
        modal: Modal;
        title: string;
        outcome: string;
        reason: string | null;
        resignName: string;
        online: boolean;
        playing: boolean;
        onclose: () => void;
        onrestart: () => void;
        onresign: () => void;
        onquit: () => void;
    } = $props();

    let dialog = $state<HTMLDialogElement>();

    onMount(() => {
        const previous = document.activeElement as HTMLElement | null;
        dialog?.showModal();
        return () => {
            dialog?.close();
            previous?.focus();
        };
    });
</script>

<dialog bind:this={dialog} oncancel={(event)=>{event.preventDefault();onclose();}} aria-labelledby="modal-title" style={paint('parchment')} class="border-[5px] border-double border-[#80603e] fixed inset-0 m-auto max-h-[85dvh] w-[min(560px,92vw)] overflow-y-auto p-7 text-[#241a10] backdrop:bg-black/60">
    <header class="mb-5 flex items-center justify-between gap-5">
        <h2 id="modal-title" class="text-2xl">{title}</h2>
        <button onclick={onclose} aria-label={$t('COMMON.CLOSE')} class="text-3xl">×</button>
    </header>
    {#if modal==='rules'}
        <ol class="space-y-3 pl-5">
            {#each [1, 2, 3, 4, 5, 6, 7] as rule (rule)}
                <li>{$t(`GAME.RULES_LIST.${rule}`)}</li>
            {/each}
        </ol>
    {:else if modal==='result'}
        <p class="text-xl">{outcome}</p>
        {#if reason}
            <p class="mt-2">{$t(`GAME.REASONS.${reason.toUpperCase()}`)}</p>
        {/if}
        <div class="mt-6 flex flex-wrap gap-3">
            <button class="ink-banner bg-red-800 px-5 py-2" onclick={onrestart}>{$t('GAME.NEW_GAME')}</button>
            <button class="ink-banner px-5 py-2" onclick={onclose}>{$t('GAME.VIEW_BOARD')}</button>
            {#if online}
                <button class="ink-banner px-5 py-2" onclick={onquit}>{$t('COMMON.QUIT')}</button>
            {/if}
        </div>
    {:else if modal==='resign'}
        <p>{$t('GAME.RESIGN_TEXT', { values: { name: resignName } })}</p>
        <button class="ink-banner mt-5 bg-red-800 px-5 py-2" onclick={onresign}>{$t('GAME.CONFIRM_RESIGN')}</button>
    {:else}
        {#if online}
            <p>{$t(playing ? 'GAME.EXIT_PLAYING' : 'GAME.EXIT_IDLE')}</p>
            <button class="ink-banner mt-5 px-5 py-2" onclick={onquit}>{$t('COMMON.QUIT')}</button>
        {:else}
            <p>Route retour a faire</p>
        {/if}
    {/if}
</dialog>

<style>
    dialog .ink-banner {
        background:#211b16;
    }
    button {
        cursor:pointer;
    }
    @media (prefers-reduced-motion: no-preference) {
        dialog[open] {
            animation:pop .3s cubic-bezier(.2,1.4,.4,1);
        }
        dialog[open]::backdrop {
            animation:veil .25s ease-out;
        }
    }
    @keyframes pop {
        from { opacity:0; transform:scale(.8) translateY(16px); }
    }
    @keyframes veil {
        from { opacity:0; }
    }
    button:focus-visible {
        outline:3px solid #278978;outline-offset:3px;
    }
</style>
