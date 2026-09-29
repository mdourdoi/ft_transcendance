<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	let	Pop_up:HTMLDialogElement;
</script>

<dialog>
	<header>
		<div>
			<span class="eyebrow">ONITAMA · LE DOJO</span>
			<h2>Test</h2>
		</div>
		<Button variant="ghost" class="close" aria-label="Fermer">×</Button>
	</header>
  	<div class="body"></div>
</dialog>

<style>
	.dialog {
		/* Lenght */
		width:min(620px,calc(100vw - 28px));
		max-height:86dvh;

		/* Alignement */
		padding:28px 32px;

		/* Display */
		color:#291e13;

		/* Background */
		background:#f5dfc2;

		/* Border */
		border:3px double #92724c;
		border-radius:3px;
		box-shadow:0 22px 100px #0008;

		/* Text */
		font-family:Georgia,serif;
	}
	
	.dialog::backdrop {
		/* Background */
		background:#1e140fbb;
		backdrop-filter:blur(4px)
	}
	
	header {
		/* Alignement */
		align-items:flex-start;
		margin-bottom:22px;
		padding-bottom:18px;

		/* Display */
		display:flex;
		justify-content:space-between;

		/* Border */
		border-bottom:1px solid #ad8a6166;
	}
	
	.eyebrow {
		/* Display */
		color:#876846;

		/* Text */
		font-size:10px;
		letter-spacing:3px;
	}
	
	h2 {
		/* Alignement */
		margin:10px 0 0;

		/* Text */
		font-weight:normal;
		font-size:29px;
	}
	
	header :global(.close) {
		/* Display */
		color:#755335;

		/* Background */
		background:transparent;

		/* Border */
		border:0;

		/* Text */
		font-size:30px;
		line-height:1;
	}
	
	.body {
		/* Text */
		font-size:16px;
		line-height:1.6;
	}
	
	@media(max-width:500px) {
		dialog	{ padding:22px; }
		h2		{ font-size:24px; }
	}

</style>