<script lang="ts">
	import Accueil from './Accueil.svelte';
	import Profil from './Profil.svelte';
	import History from './History.svelte';
	import Stat from './Stat.svelte';
	import Friends from './Friends.svelte';

	let onglet = "home";

	const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`);

	function OngletChange (Mode: string)
	{
    	onglet = Mode;
    	console.log(onglet);
  	}
</script>

<main>
	<div class="background">
  		<img src="../assets/interface-vide.png" alt="Back">
	</div>
	<div class="top_bar">
		<div class="Logo_top_bar">
			<img class="Logo" src="../assets/onitama-detoure.png" alt="Logo">
		</div>
		<nav class="navbar">
			{#if onglet === "home"}
				<button class="accueil_button" onclick={() => OngletChange("home")}>
					<img src="../assets/accueil_active.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("historique")}>
					<img src="../assets/history.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("stats")}>
					<img src="../assets/stats.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("profil")}>
					<img src="../assets/user.png" alt="Accueil"/>
				</button>
			{:else if onglet === "historique"}
				<button class="accueil_button" onclick={() => OngletChange("home")}>
					<img src="../assets/accueil.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("historique")}>
					<img src="../assets/history_active.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("stats")}>
					<img src="../assets/stats.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("profil")}>
					<img src="../assets/user.png" alt="Accueil"/>
				</button>
			{:else if onglet === "stats"}
				<button class="accueil_button" onclick={() => OngletChange("home")}>
					<img src="../assets/accueil.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("historique")}>
					<img src="../assets/history.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("stats")}>
					<img src="../assets/stats_active.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("profil")}>
					<img src="../assets/user.png" alt="Accueil"/>
				</button>
			{:else if onglet === "profil"}
				<button class="accueil_button" onclick={() => OngletChange("home")}>
					<img src="../assets/accueil.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("historique")}>
					<img src="../assets/history.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("stats")}>
					<img src="../assets/stats_active.png" alt="Accueil"/>
				</button>
				<button class="accueil_button" onclick={() => OngletChange("profil")}>
					<img src="../assets/user.png" alt="Accueil"/>
				</button>
			{/if}
		</nav>
	</div>
	{#if onglet === "home"}
		<Accueil/>
	{:else if onglet === "profil"}
		<Profil/>
	{:else if onglet === "historique"}
		<History/>
	{:else if onglet === "stats"}
		<Stat/>
	{/if}
	<Friends/>
</main>

<style>

	:global(:root) {
		--friends-width: max(285px, 20vw);
		--topbar-height: clamp(115px, 14vh, 145px);
	}

	.background {
		/* Position */
  		position: fixed;
  		inset: 0;

		/* Lenght */
  		width: 100vw;
  		height: 100vh;
	}

	.background img {
		/* Position */
		position: fixed;
		inset: 0;

		/* Lenght */
		width: 100vw;
		height: 100vh;

		/* Object */
		/* object-fit: cover; */
		/* object-position: center; */
	}

	.top_bar {
		/* Position */
		position: fixed;
		left: 0;
		top: 0;
		z-index: 100;

		/* Lenght */
		width: calc(100vw - var(--friends-width));
		height: var(--topbar-height);
		grid-template-columns:clamp(250px, 22vw, 335px) minmax(0, 1fr);

		/* Alignement */
		align-items: center;

		/* Display */
		display: grid;

		/* Background */
		background: transparent;
	}

	.Logo_top_bar {
		/* Position */
		position: relative;

		/* Lenght */
		width: 15vw;
		height: 100%;

		/* Alignement */
		align-items: center;

		/* Display */
		display: grid;
		justify-content: flex-start;
		overflow: visible;
	}

	.Logo {
		/* Position */
		position: absolute;
		top: 0%;
		left: 25%;

		/* Lenght */
		height: auto;

		/* Object */
		object-fit: contain;

		/* Cursor */
		cursor: pointer;
	}

	.navbar {
		/* Lenght  */
		width: 100%;
		height: 100%;

		/* Alignement */
		align-items: center;
		gap: clamp(25px, 3.7vw, 65px);

		/* Display */
		display: flex;
		justify-content: center;
	}

	.accueil_button {
		/* Position */
		position: relative;

		/* Lenght  */
		width: clamp(105px, 10vw, 155px);
		height: clamp(80px, 10vh, 105px);

		/* Alignement */
		padding: 0;
		margin: 0;
		align-items: center;

		/* Display */
		display: flex;
		justify-content: center;
		outline: none;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Cursor */
		cursor: pointer;
	}

	.accueil_button img {
		/* Lenght */
		width: 100%;
		height: 100%;

		/* Display */
		display: block;

		/* Object */
		object-fit: contain;
		object-position: center;

		/* Cursor */
		pointer-events: none;
	}

</style>