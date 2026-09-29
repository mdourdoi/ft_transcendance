<script lang="ts">
	import { onMount } from 'svelte';

	export let	onclose: () => void;
	export let	game: {
		id:string;
		result:string;
		mode:string;
		opponent:string;
		opponentId?:string;
		avatar:string;
		duration:string;
		date:string;
		reason?:string;
		xpEarned?:number;
		ratingDelta?:number;
		movesCount?:number
	};

	let	dialog: HTMLDialogElement;
	export let	open = true;
	let	loading = false;
	let	error = '';
	let	notice = '';

	onMount(()=> {
		const previous = document.activeElement as HTMLElement | null;
		dialog.showModal();
		// void load_data();
		return()=> {
			open = false;
			dialog.close();
			if(previous?.isConnected)
				previous.focus();
		};
	});
</script>
<!-- oncancel={(e)=>{e.preventDefault(); onclose();}} -->
<dialog bind:this={dialog} aria-label={'Détail de la partie'} oncancel={(e)=>{e.preventDefault(); onclose();}}>
	<header>
		<div>
			<small>ONITAMA · LE DOJO</small>
			<h2>{'Détail de la partie'}</h2>
		</div>
		<button type="button" onclick={onclose} aria-label={'Fermer'}>×</button>
	</header>
	<div class="opponent">
		<img src={game.avatar} alt=""/>
		<div>
			<strong>{game.opponent}</strong>
			<p>{game.date}</p>
		</div>
		<b>{game.result ==='Victory' ? 'Victoire' : game.result === 'Defeat' ? 'Défaite' : game.result}</b>
	</div>
 	<dl>
		<div>
			<dt>{'Mode'}</dt>
			<dd>{game.mode === 'Ranked' ? 'Classées' : game.mode ==='Normal' ? 'Normales' :game.mode==='Training'? 'Entraînement' : game.mode}</dd>
		</div>
		<div>
			<dt>{'Durée'}</dt>
			<dd>{game.duration}</dd>
		</div>
	</dl>
	{#if loading}
		<p role="status">{'Chargement…'}</p>
	{:else}
 		<dl>
			<div>
				<dt>{'Fin de partie'}</dt>
				<dd>{'Details Non renseigné'}</dd>
			</div>
			<div>
				<dt>{'XP gagnés'}</dt>
				<!-- <dd>{details.xpEarned ?? '—'}</dd> -->
			</div>
			<div>
				<dt>{'Variation du classement'}</dt>
				<!-- <dd>{details.ratingDelta == null?'—':`${details.ratingDelta>0?'+':''}${details.ratingDelta}`}</dd> -->
			</div>
			<div>
				<dt>{'Nombre de coups'}</dt>
				<!-- <dd>{details.movesCount ?? '—'}</dd> -->
			</div>
		</dl>
 	{/if}
	{#if error}
		<p role="alert">{error}</p>
		<!-- {#if loadDetails && error === 'Impossible de charger les détails.'} -->
			<!-- <button type="button" onclick={load} disabled={loading}>{$t('Réessayer')}</button> -->
		<!-- {/if} -->
	{/if}
	{#if notice}
		<p role="status">{notice}</p>
	{/if}
	<footer>
		<!-- <button type="button" disabled={!onViewProfile || !game.opponentId} onclick={()=>{if(game.opponentId&&onViewProfile){onclose();onViewProfile(game.opponentId);}}}>{$t('Voir le profil')}</button> -->
		<!-- <button type="button" disabled={!onRematch || !game.opponentId || sending || !!notice} onclick={rematch}>{sending?$t('Envoi…'):$t('Proposer une revanche')}</button> -->
	</footer>
</dialog>

<style>
	 dialog {
		/* Lenght */
		width:min(600px,calc(100vw - 28px));
		max-height:85dvh;

		/* Alignement */
		padding:24px;

		/* Display */
		color:#30251b;
		overflow:auto;

		/* Background */
		background:#f1e4cd;

		/* Border */
		border:3px double #92724c;
		border-radius:8px;
		box-shadow:0 20px 80px #0006;
		box-sizing:border-box;

		/* Text */
		font-family:Georgia,serif;
	}
	
	dialog::backdrop {
		/* Background */
		background:#17120eb3;
	}
	
	header,
	.opponent,
	footer {
		/* Alignement */
		align-items:center;
		gap:14px;

		/* Display */
		display:flex;
		justify-content:space-between;
	}
	
	.h2 {
		/* Alignement */
		margin:6px 0 20px;
	}
	
	header button{
		/* Background */
		background:transparent;

		/* Border */
		border:0;

		/* Text */
		font-size:28px;
	}
	
	.opponent img {
		/* Lenght */
		width:58px;
		height:58px;

		/* Object */
		object-fit:cover;

		/* Border */
		border-radius:50%;
	}
	
	.opponent div {
		/* Lenght */
		min-width:0;

		/* Display */
		flex:1;
		overflow-wrap:anywhere;
	}
	
	.opponent p {
		/* Text */
		font-size:13px;
	}
	
	dl {
		/* Lenght */
		grid-template-columns:1fr 1fr;

		/* Alignement */
		gap:12px;

		/* Display */
		display:grid;
	}
	
	dl div {
		/* Alignement */
		padding:12px;

		/* Border */
		border:1px solid #92724c55;
	}
	
	dt {
		/* Text */
		font-size:12px;
	}
	
	dd {
		/* Alignement */
		margin:7px 0 0;

		/* Display */
		overflow-wrap:anywhere;
	}
	
	button {
		/* Alignement */
		padding:8px 12px;

		/* Display */
		color:inherit;

		/* Background */
		background:#e4d0ad;

		/* Border */
		border:1px solid #92724c;
		border-radius:4px;

		/* Cursor */
		cursor:pointer;

		/* Text */
		font:inherit;
	}
	
	button:disabled {
		/* Display */
		opacity:.5;

		/* Cursor */
		cursor:not-allowed;
	}
	
	button:focus-visible {
		/* Border */
		outline:2px solid #a22520;
		outline-offset:3px;
	}
	
	footer {
		/* Alignement */
		flex-wrap:wrap;
		margin-top:20px;
	}
	
	@media(max-width:420px) {
		.dl{grid-template-columns:1fr}
	}

	[role=alert]{color:#92251d}

</style>