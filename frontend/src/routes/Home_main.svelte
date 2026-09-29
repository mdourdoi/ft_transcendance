<script lang="ts">
	// Import routes
	import Accueil from './Accueil.svelte';
	import Profil from './Profil.svelte';
	import History from './History.svelte';
	import Stat from './Stat.svelte';
	import Friends from './Friends.svelte';
	import Sakura from './SakuraPetals.svelte'

	// Value Declaration
	let onglet = "home";
	let sakura: Sakura | undefined;

	// Fonction
	function OngletChange (Mode: string)
	{
    	onglet = Mode;
    	// console.log(onglet);
  	}
</script>

<Sakura bind:this={sakura} zIndex={200} />

<main>
	<div class="Background">
  		<img src="../assets/home/background/background.png" alt="Back">
	</div>
	<div class="Top_bar">
		<div class="Logo_top_bar">
			<img class="Logo" src="../assets/home/logo/onitama.png" alt="Logo" onclick={() => sakura?.launchBurst()}/>
		</div>		
		<nav class="Navbar">
			{#if onglet === "home"}
				<button class="Home_button" onclick={() => OngletChange("home")}>
					<img src="../assets/home/icone/accueil_active.png" alt="Accueil"/>
					<h2><u>Accueil</u></h2>
				</button>
				<button class="Home_button" onclick={() => OngletChange("historique")}>
					<img src="../assets/home/icone/history.png" alt="Accueil"/>
					<h2>Historique</h2>
				</button>
				<button class="Home_button" onclick={() => OngletChange("stats")}>
					<img src="../assets/home/icone/stats.png" alt="Accueil"/>
					<h2>Stats</h2>
				</button>
				<button class="Home_button" onclick={() => OngletChange("profil")}>
					<img src="../assets/home/icone/profil.png" alt="Accueil"/>
					<h2>Profil</h2>
				</button>
			{:else if onglet === "historique"}
				<button class="Home_button" onclick={() => OngletChange("home")}>
					<img src="../assets/home/icone/accueil.png" alt="Accueil"/>
					<h2>Accueil</h2>
				</button>
				<button class="Home_button" onclick={() => OngletChange("historique")}>
					<img src="../assets/home/icone/history_active.png" alt="Accueil"/>
					<h2><u>Historique</u></h2>
				</button>
				<button class="Home_button" onclick={() => OngletChange("stats")}>
					<img src="../assets/home/icone/stats.png" alt="Accueil"/>
					<h2>Stats</h2>
				</button>
				<button class="Home_button" onclick={() => OngletChange("profil")}>
					<img src="../assets/home/icone/profil.png" alt="Accueil"/>
					<h2>Profil</h2>
				</button>
			{:else if onglet === "stats"}
				<button class="Home_button" onclick={() => OngletChange("home")}>
					<img src="../assets/home/icone/accueil.png" alt="Accueil"/>
					<h2>Accueil</h2>
				</button>
				<button class="Home_button" onclick={() => OngletChange("historique")}>
					<img src="../assets/home/icone/history.png" alt="Accueil"/>
					<h2>Historique</h2>
				</button>
				<button class="Home_button" onclick={() => OngletChange("stats")}>
					<img src="../assets/home/icone/stats_active.png" alt="Accueil"/>
					<h2><u>Stats</u></h2>
				</button>
				<button class="Home_button" onclick={() => OngletChange("profil")}>
					<img src="../assets/home/icone/profil.png" alt="Accueil"/>
					<h2>Profil</h2>
				</button>
			{:else if onglet === "profil"}
				<button class="Home_button" onclick={() => OngletChange("home")}>
					<img src="../assets/home/icone/accueil.png" alt="Accueil"/>
					<p>Accueil</p>
				</button>
				<button class="Home_button" onclick={() => OngletChange("historique")}>
					<img src="../assets/home/icone/history.png" alt="Accueil"/>
					<p>Historique</p>
				</button>
				<button class="Home_button" onclick={() => OngletChange("stats")}>
					<img src="../assets/home/icone/stats.png" alt="Accueil"/>
					<p>Stats</p>
				</button>
				<button class="Home_button" onclick={() => OngletChange("profil")}>
					<img src="../assets/home/icone/profil_active.png" alt="Accueil"/>
					<p><u>Profil</u></p>
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

	.Background {
		/* Position */
  		position: fixed;
  		inset: 0;

		/* Lenght */
  		width: 100vw;
  		height: 100vh;
	}

	.Background img {
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

	.Top_bar {
		/* Position */
		position: fixed;
		left: 0;
		top: 0;
		z-index: 100;

		/* Lenght */
		width: calc(100vw - var(--friends-width));
		height: var(--topbar-height);
		/* grid-template-columns:clamp(250px, 22vw, 335px) minmax(0, 1fr); */
		grid-template-columns: 22vw minmax(0, 1fr);

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

	.Navbar {
		/* Lenght  */
		width: 100%;
		height: 100%;

		/* Alignement */
		align-items: center;
		/* gap: clamp(25px, 3.7vw, 65px); */
		gap: 0;

		/* Display */
		display: flex;
		justify-content: center;
	}

	.Home_button {
		/* Position */
		position: relative;

		/* Lenght  */
		width: 10vw;
		height: 5vh;

		/* Alignement */
		padding: 0;
		margin: 0;
		align-items: center;

		/* Display */
		display: grid;
		justify-content: center;
		outline: none;
		color:black;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Cursor */
		cursor: pointer;

		/* Object */
		object-fit: contain;
		object-position: center;

		/* Text */
		font-family: cursive;
		font-style: italic;
		/* font-size:clamp(16px,1.55vw, 26px); */
	}

	.Home_button img {
		/* Lenght */
		width: 10vw;
		height: 5vh;

		/* Display */
		display: block;

		/* Object */
		object-fit: contain;
		object-position: center;

		/* Cursor */
		pointer-events: none;
	}

	.Home_button:hover {
		/* Border */
		/* border-radius: 50%; */
		/* background: transparent; */
		border: none;
		box-shadow: none;
	}

</style>