<script lang="ts">
	import Pop_up from './Game_Popup.svelte'

	let	Exit_screen = false;
	let	Pop_up_choice: 'Message' | 'Pause' | 'Setting' | 'Quit' | 'In Game' | 'Historique' | 'Regles du jeu';

	function handleKeyDown(any) {
		// Fermer avec Échap
		if (any.key === 'Escape') {
			Exit_screen = true;
		}
	}

</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="On_Live">
	{#if Exit_screen === true}
		<div class="Exit_screen">
			<boutton>
				<!-- To exit -->
			</boutton>
		</div>
	{:else}
		<main class="Game_Page">
			<div class="Logo">
				<img class="Logo_Image" src="../assets/home/logo/onitama.png">
			</div>
			<div class="Types_Games">
				 <header class="Title">
				 	<!-- <img class="" src=""> -->
					<h2>Partie "A faire un switch ou soit en images"</h2>
				</header>
			</div>
			<nav class="Top_navbar">
				<button class="Top_bar_button" onclick={()=>Pop_up_choice='Message'}>
					<img src="">
				</button>
				<button class="Top_bar_button" onclick={()=>Pop_up_choice='Pause'}>
					<img src="">
				</button>
				<button class="Top_bar_button" onclick={()=>Pop_up_choice='Setting'}>
					<img src="">
				</button>
				<button class="Top_bar_button" onclick={()=>Pop_up_choice='Quit'}>
					<img src="">
				</button>
			</nav>
			<nav class="Side_navbar">
				<button class="Left_bar_button" onclick={()=>Pop_up_choice='In Game'}>
					
				</button>
				<button class="Left_bar_button" onclick={()=>Pop_up_choice='Historique'}>
					
				</button>
				<button class="Left_bar_button" onclick={()=>Pop_up_choice='Regles du jeu'}>

				</button>
			</nav>
			<section class="Player_section">
				
			</section>
			<section class="Board_section">

			</section>
			<section class="Card_section">

			</section>
		</main>
	{/if}
</div>

{#if Pop_up_choice}
	<Pop_up>
		{#if Pop_up_choice === "Message"}

		{:else if Pop_up_choice === "Pause"}

		{:else if Pop_up_choice === "Setting"}

		{:else if Pop_up_choice === "Quit"}

		{:else if Pop_up_choice === "Historique"}

		{:else if Pop_up_choice === "Regles du jeu"}

		{/if}
	</Pop_up>
{/if}

<style>
	.On_Live {
		/* Position */
		position: relative;

		/* Background */
		background: no-repeat url("../assets/home/background/background.png")
	}
</style>
