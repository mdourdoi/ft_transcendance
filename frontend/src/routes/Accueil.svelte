<script lang="ts">

</script>

<div class="home_page">
	<section class="home_hero">
		<!-- <img class="home_quote" src="../assets/paysage-principal.png" alt="L'art du déplacement, la maîtrise de soi"/> -->
		<button class="play_button" aria-label="Jouer">
		<img src="../assets/jouer.png" alt="Jouer"/>
		</button>
	</section>
	<section class="home_bottom">
		<section class="news_panel">
			<div class="news_title"> ACTUALITÉS </div>
			<img class="news_background" src="../assets/actualites-temple2.png" alt=""/>
			<div class="news_gradient"></div>
			<div class="news_content">
				<h2> Nouvelle saison </h2>
				<p> De nouveaux défis vous attendent sur le chemin. </p>
				<div class="news_navigation">
					<button class="news_arrow" aria-label="Actualité précédente"> ‹ </button>
					<div class="news_dots">
						<button class="news_dot active" aria-label="Actualité 1"></button>
						<button class="news_dot" aria-label="Actualité 2" ></button>
						<button class="news_dot" aria-label="Actualité 3" ></button>
					</div>
					<button class="news_arrow" aria-label="Actualité suivante"> › </button>
				</div>
			</div>
		</section>
		<section class="game_modes">
			<button class="game_mode_card" aria-label="Partie classée">
				<h1><br>RANKED GAMES</h1>
				<img src="../assets/ranked-card.png" alt="Parties classées"/>
			</button>
			<button class="game_mode_card" aria-label="Partie normale">
				<h1><br>NORMAL GAMES</h1>
				<img src="../assets/normal-card.png" alt="Partie normale"/>
			</button>
			<button class="game_mode_card" aria-label="Défis">
				<h1><br>TRAINING GAMES</h1>
				<img src="../assets/challenge-card.png" alt="Défis"/>
			</button>
			<div class="home_bottom_quote">
				<p> « Un petit pas déplace un grand destin. » </p>
				<span> — 御 寺 間 —</span>
			</div>
		</section>
	</section>
</div>

<style>
	.home_page {
		/* Position */
		position: fixed;
		left: 0;
		top: clamp(115px, 14vh, 145px);
		z-index: 10;

		/* Lenght */
		width:calc(100vw - var(--friends-width));
		height:calc(100vh - clamp(115px, 14vh, 145px));
		grid-template-rows:minmax(330px, 52%) minmax(0, 48%);

		/* Display */
		display: grid;
		overflow: hidden;
	}

	.home_hero {
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
		background: url("../assets/paysage-sans-interface2.png");
		background-size: 100% 101%;

		/* Border */
		border-radius: 3%;	

	}

	.home_quote {
		/* Position */
		position: absolute;
		left:clamp(0px, 0vw, 0px);
		top:clamp(0px,0px,0px);

		/* Lenght */
		width:clamp(1800px,1400px,900px);
		height: auto;

		/* Cursor */
		pointer-events: none;
		user-select: none;

		/* Object */
		object-fit: contain;
	}

	.play_button {
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

	.play_button img {
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

	.play_button:hover {
		/* Display */
		filter:drop-shadow(0 7px 7px rgba(0, 0, 0, 0.2));

		/* Animation */
		transform:translate(-50%, -50%) scale(1.035);
	}

	.play_button:active {
		/* Animation */
		transform:translate(-50%, -50%) scale(0.975);
	}

	.home_bottom {
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

	.news_panel {
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

	.news_background {
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

	.news_gradient {
		/* Position */
		position: absolute;
		inset: 0;
		z-index: 1;

		/* Background */
		background:linear-gradient( to bottom, transparent 30%,rgba(12, 10, 8, 0.15) 50%,rgba(12, 10, 8, 0.9) 100%);

		/* Cursor */
		pointer-events: none;
	}

	.news_title {
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

	.news_content {
		/* Position */
		position: absolute;
		left:clamp(14px,1.3vw,22px);
		right:clamp(14px,1.3vw,22px);
		bottom:clamp(10px,1.2vh,18px);
		z-index: 3;

		/* Display */
		color:#f0e2ca;
	}

	.news_content h2 {
		/* Alignement */
		margin:0 0 6px;

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(18px, 1.6vw, 27px);
	}

	.news_content p {
		/* Alignement */
		margin: 0;

		/* Text */
		font-family: Georgia, serif;
		font-size:clamp(11px, 0.95vw, 15px);
		line-height: 1.4;
	}

	.news_navigation {
		/* Lenght */
		grid-template-columns:40px 1fr 40px;

		/* Alignement */
		align-items: center;
		margin-top:clamp(8px, 1.2vh, 14px);

		/* Display */
		display: grid;
	}

	.news_arrow {
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

	.news_arrow:hover {
		/* Display */
		opacity: 0.8;

		/* Animation */
		transform:scale(1.18);
	}

	.news_dots {
		/* Alignement */
		align-items: center;
		gap: 10px;

		/* Display */
		display: flex;
		justify-content: center;
	}

	.news_dot {
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

	.news_dot.active {
		/* Background */
		background:#eee0c7;
	}

	.game_modes {
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

	.game_mode_card {
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

	.game_mode_card img {
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

	.game_mode_card:hover {
		/* Display */
		filter:drop-shadow(0 6px 5px rgba(0, 0, 0, 0.15));

		/* Animation */
		transform:translateY(-5px) scale(1.012);
	}

	.game_mode_card:active {
		/* Animation */
		transform:translateY(-1px) scale(0.985);
	}

	.home_bottom_quote {
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

	.home_bottom_quote p {
		/* Alignement */
		margin: 0;

		/* Text */
		font-family: cursive;
		font-style: italic;
		font-size:clamp(16px,1.55vw, 26px);
	}

	.home_bottom_quote span {
		/* Text */
		font-family: Georgia, serif;
		font-size:clamp(10px, 0.85vw, 14px);
	}

		@media (max-width: 1250px) {
		.home_page {grid-template-rows: minmax(300px, 50%) minmax(0, 50%);}
		.home_quote {width:clamp(160px, 17vw, 210px);}
		.play_button {left: 67%; width: clamp(300px, 32vw, 400px);}
		.home_bottom {grid-template-columns: minmax(280px, 38%) minmax(0, 1fr); padding-left: 15px;}
		.game_modes {gap: 5px;}
	}
</style>