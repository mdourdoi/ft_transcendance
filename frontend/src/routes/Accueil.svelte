<script lang="ts">

</script>

<div class="Home_page">
	<section class="Home_content">
		<!-- <img class="home_quote" src="../assets/paysage-principal.png" alt="L'art du déplacement, la maîtrise de soi"/> -->
		<button class="Play_button" aria-label="Jouer">
		<img src="../assets/home/boutton/play.png" alt="Jouer"/>
		</button>
	</section>
	<section class="Home_bottom">
		<section class="News_page">
			<div class="News_title"> ACTUALITÉS </div>
			<img class="News_background" src="../assets/home/background/actuality_1.png" alt=""/>
			<div class="News_css"></div>
			<div class="News_content">
				<h2> Nouvelle saison </h2>
				<p> De nouveaux défis vous attendent sur le chemin. </p>
				<div class="News_carrousel">
					<button class="News_arrows" aria-label="Actualité précédente"> ‹ </button>
					<div class="News_boutton">
						<button class="News_boutton_active" aria-label="Actualité 1"></button>
						<button class="News_boutton" aria-label="Actualité 2" ></button>
						<button class="News_boutton" aria-label="Actualité 3" ></button>
					</div>
					<button class="News_arrows" aria-label="Actualité suivante"> › </button>
				</div>
			</div>
		</section>
		<section class="Game_modes">
			<button class="Game_modes_cards" aria-label="Partie classée">
				<h1><br>RANKED GAMES</h1>
				<img src="../assets/home/background/ranked_card.png" alt="Parties classées"/>
			</button>
			<button class="Game_modes_cards" aria-label="Partie normale">
				<h1><br>NORMAL GAMES</h1>
				<img src="../assets/home/background/normal_card.png" alt="Partie normale"/>
			</button>
			<button class="Game_modes_cards" aria-label="Défis">
				<h1><br>TRAINING GAMES</h1>
				<img src="../assets/home/background/training_card.png" alt="Défis"/>
			</button>
			<div class="Home_bottom_quote">
				<p> « Un petit pas déplace un grand destin. » </p>
				<span> — 御 寺 間 —</span>
			</div>
		</section>
	</section>
</div>

<style>
	.Home_page {
		/* Position */
		position: fixed;
		left: 0;
		/* top: clamp(115px, 14vh, 145px); */
		top: 14vh;
		z-index: 10;

		/* Lenght */
		width:calc(100vw - var(--friends-width));
		/* height:calc(100vh - clamp(115px, 14vh, 145px)); */
		height:calc(100vh - clamp(115px, 14vh, 145px));
		grid-template-rows:minmax(330px, 52%) minmax(0, 48%);

		/* Display */
		display: grid;
		overflow: hidden;
	}

	.Home_content {
		/* Position */
		position: relative;
		left: 8px;
		/* top: 2px; */

		/* Lenght */
		width: 98%;
		height: 100%;

		/* Display */
		overflow: hidden;

		/* Background */
		background: url("../assets/home/background/home.png");
		background-size: 100% 101%;

		/* Border */
		border-radius: 3%;	

	}
/* 
	.Home_bottom {
		/* Position */
		/* position: absolute;
		left:clamp(0px, 0vw, 0px);
		top:clamp(0px,0px,0px); */

		/* Lenght */
		/* width:clamp(1800px,1400px,900px);
		height: auto; */

		/* Cursor */
		/* pointer-events: none; */
		/* user-select: none; */

		/* Object */
		/* object-fit: contain; */
	/* } */

	.Play_button {
		/* Position */
		position: absolute;
		left: 69%;
		top: 75%;

		/* Lenght */
		width:clamp(340px,34vw,535px);

		/* Display */
		outline: none;

		/* Alignement */
		margin: 0;
		padding: 0;

		/* Animation */
		transform:translate(-50%, -50%);
		transition:transform 160ms ease, filter 160ms ease;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Cursor */
		cursor: pointer;
	}

	.Play_button img {
		/* Lenght */
		width: 100%;
		height: auto;

		/* Display */
		display: block;

		/* Object */
		object-fit: contain;

		/* Cursor */
		pointer-events: none;
		user-select: none;
	}

	.Play_button:hover {
		/* Display */
		filter:drop-shadow(0 7px 7px rgba(0, 0, 0, 0.2));

		/* Animation */
		transform:translate(-50%, -50%) scale(1.035);
	}

	.Play_button:active {
		/* Animation */
		transform:translate(-50%, -50%) scale(0.975);
	}

	.Home_bottom {
		/* Lenght */
		min-height: 0;
		width: 100%;
		height: 100%;
		grid-template-columns:minmax(300px, 37%) minmax(0, 1fr);

		/* Alignement */
		gap:clamp(10px, 9vw, 20px);
		padding:8px 14px 12px 25px;

		/* Display */
		display: grid;

		/* Background */
		/* background: no-repeat url("../assets/bottom_home.png"); */
		background-size: cover;
	}

	.News_page {
		/* Position */
		position: relative;
		/* top: -5px; */
		left: -15px;
		top: -8px;

		/* Lenght */
		width: 100%;
		height: 105%;
		min-height: 0;

		/* Display */
		overflow: hidden;

		/* Background */
		background: #16120f;

		/* Border */
		border:2px solid rgba(25, 19, 14,0.88);
		border-radius: 5%;
		/* box-shadow:0 4px 10px rgba(0, 0, 0, 0.2); */
	}

	.News_background {
		/* Position */
		position: absolute;
		inset: 0;
		z-index: 0;

		/* Lenght */
		width: 100%;
		height: 100%;

		/* Object */
		object-fit: cover;
		object-position: center;

		/* Cursor */
		user-select: none;
		pointer-events: none;
	}

	.News_css {
		/* Position */
		position: absolute;
		inset: 0;
		z-index: 1;

		/* Background */
		background:linear-gradient( to bottom, transparent 30%,rgba(12, 10, 8, 0.15) 50%,rgba(12, 10, 8, 0.9) 100%);

		/* Cursor */
		pointer-events: none;
	}

	.News_title {
		/* Position */
		position: absolute;
		top: 0;
		left: 0;
		z-index: 3;

		/* Alignement */
		padding:8px 25px;

		/* Display */
		color:#eee0c7;

		/* Background */
		background:#17130f;

		/* Object */
		clip-path:polygon(0 0, 100% 0, 90% 100%, 0 100%);

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(13px, 1vw, 17px);
		font-weight: 600;
	}

	.News_content {
		/* Position */
		position: absolute;
		left:clamp(14px,1.3vw,22px);
		right:clamp(14px,1.3vw,22px);
		bottom:clamp(10px,1.2vh,18px);
		z-index: 3;

		/* Display */
		color:#f0e2ca;
	}

	.News_content h2 {
		/* Alignement */
		margin:0 0 6px;

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(18px, 1.6vw, 27px);
	}

	.News_content p {
		/* Alignement */
		margin: 0;

		/* Text */
		font-family: Georgia, serif;
		font-size:clamp(11px, 0.95vw, 15px);
		line-height: 1.4;
	}

	.News_carrousel {
		/* Lenght */
		grid-template-columns:40px 1fr 40px;

		/* Alignement */
		align-items: center;
		margin-top:clamp(8px, 1.2vh, 14px);

		/* Display */
		display: grid;
	}

	.News_arrows {
		/* Lenght */
		width: 38px;
		height: 32px;

		/* Alignement */
		align-items: center;
		justify-content: center;
		padding: 0;

		/* Display */
		display: flex;
		color:#f3e4cb;

		/* Animation */
		transition:transform 120ms ease, opacity 120ms ease;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Cursor */
		cursor: pointer;

		/* Text */
		font-family:Georgia, serif;
		font-size: 34px;
	}

	.News_arrows:hover {
		/* Display */
		opacity: 0.8;

		/* Animation */
		transform:scale(1.18);
	}

	.News_boutton {
		/* Alignement */
		align-items: center;
		gap: 10px;

		/* Display */
		display: flex;
		justify-content: center;
	}

	.News_boutton {
		/* Lenght */
		width: 9px;
		height: 9px;

		/* Alignement */
		padding: 0;

		/* Background */
		background:rgba(240, 226, 202, 0.3);

		/* Border */
		border: none;
		border-radius: 50%;		
		
		/* Cursor */
		cursor: pointer;
	}

	.News_boutton.active {
		/* Background */
		background:#eee0c7;
	}

	.Game_modes {
		/* Lenght */
		min-width: 0;
		min-height: 0;
		grid-template-columns:repeat(3, minmax(0, 1fr));
		grid-template-rows:minmax(0, 1fr) auto;

		/* Alignement */
		gap: 0.5vw;

		/* Display */
		display: grid;
	}

	.Game_modes_cards {
		/* Lenght */
		min-width: 0;
		min-height: 0;
		width: 100%;
		height: 100%;

		/* Alignement */
		padding: 0;

		/* Display */
		outline: none;
		overflow: hidden;

		/* Animation */
		transition:transform 160ms ease,filter 160ms ease;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Cursor */
		cursor: pointer;
	}

	.Game_modes_cards img {
		/* Lenght */
		width: 100%;
		height: 100%;

		/* Display */
		display: block;

		/* Object */
		object-fit: contain;
		object-position:top;

		/* Cursor */
		pointer-events: none;
		user-select: none;
	}

	.Game_modes_cards:hover {
		/* Display */
		filter:drop-shadow(0 6px 5px rgba(0, 0, 0, 0.15));

		/* Animation */
		transform:translateY(-5px) scale(1.012);
	}

	.Game_modes_cards:active {
		/* Animation */
		transform:translateY(-1px) scale(0.985);
	}

	.Home_bottom_quote {
		/* Alignement */
		align-items: center;
		gap: 3px;
		grid-column: 1 / -1;
		padding: 4px 5px;

		/* Display */
		display: flex;
		color: #1d1611;
		flex-direction: column;
		justify-content: center;

		/* Text */
		text-align: center;
	}

	.Home_bottom_quote p {
		/* Alignement */
		margin: 0;

		/* Text */
		font-family: cursive;
		font-style: italic;
		font-size:clamp(16px,1.55vw, 26px);
	}

	.Home_bottom_quote span {
		/* Text */
		font-family: Georgia, serif;
		font-size:clamp(10px, 0.85vw, 14px);
	}

		@media (max-width: 1250px) {
		.Home_page {grid-template-rows: minmax(300px, 50%) minmax(0, 50%);}
		.Home_quote {width:clamp(160px, 17vw, 210px);}
		.Play_button {left: 67%; width: clamp(300px, 32vw, 400px);}
		.Home_bottom {grid-template-columns: minmax(280px, 38%) minmax(0, 1fr); padding-left: 15px;}
		.Game_modes {gap: 5px;}
	}
</style>