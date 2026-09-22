<script lang="ts">
	const statsModes = 
	[{name: "Classées",value: 42,color: "#8d0909"},
	{name: "Normales",value: 28,color: "#343434"},
	{name: "Défis",value: 18,color: "#777777"},
	{name: "Événements",value: 12,color: "#171717"}];

	const mostPlayedCards =
	[{rank: 1,name: "Tigre",games: 56,image: "../assets/stats/cards/tigre.png"},
	{rank: 2,name: "Dragon",games: 48,image: "../assets/stats/cards/dragon.png"},
	{rank: 3,name: "Grue",games: 42,image: "../assets/stats/cards/grue.png"},
	{rank: 4,name: "Serpent",games: 38,image: "../assets/stats/cards/serpent.png"},
	{rank: 5,name: "Mante",games: 31,image: "../assets/stats/cards/mante.png"}];

	const frequentOpponents =
	[{rank: 1,name: "RaiNeko",games: 67,avatar: "../assets/raineko.png"},
	{rank: 2,name: "Tsuki",games: 54,avatar: "../assets/tsuki.png"},
	{rank: 3,name: "Daiko",games: 49,avatar: "../assets/daiko.png"},
	{rank: 4,name: "Akemi",games: 37,avatar: "../assets/akemi.png"},
	{rank: 5,name: "Shiro",games: 33,avatar: "../assets/shiro.png"}];

	const hourlyStats =
	[{ label: "0h", value: 6 },
	{ label: "4h", value: 12 },
	{ label: "6h", value: 17 },
	{ label: "8h", value: 23 },
	{ label: "10h", value: 28 },
	{ label: "12h", value: 42 },
	{ label: "14h", value: 78 },
	{ label: "16h", value: 88 },
	{ label: "18h", value: 51 },
	{ label: "20h", value: 36 },
	{ label: "22h", value: 24 }];

	const rankProgress =
	[{ month: "Jan", x: 8, y: 76 },
	{ month: "Fév", x: 25, y: 62 },
	{ month: "Mar", x: 42, y: 50 },
	{ month: "Avr", x: 59, y: 39 },
	{ month: "Mai", x: 76, y: 39 },
	{ month: "Juin", x: 94, y: 18 }];

	const rankPolyline = rankProgress
		.map((point) => `${point.x},${point.y}`)
		.join(" ");
</script>

<main class="stats_page">
	<aside class="stats_sidebar">
		<div class="stats_kanji"> 統 </div>
		<div class="stats_side_quote">« La maîtrise<br> de soi mène<br> à la victoire. » </div>
		<div class="stats_stamp"> 棋 </div>
		<nav class="stats_filters">
			<button class="active"> Vue d’ensemble</button>
			<button> Performances</button>
			<button>Modes de jeu</button>
			<button>Adversaires</button>
			<button>Cartes les plus jouées</button>
			<button>Progression</button>
		</nav>
	</aside>
	<section class="stats_content">
		<header class="stats_header">
			<h1>Statistiques globales</h1>
			<p>Un chemin de discipline, une progression sans fin.</p>
		</header>
		<section class="stats_summary">
			<div class="summary_card">
				<div class="summary_main">
					<span class="summary_icon">⚔</span>
					<strong>287</strong>
				</div>
				<span>Parties jouées</span>
			</div>
			<div class="summary_card">
				<div class="summary_main red">
					<span class="summary_icon">♛</span>
					<strong>203</strong>
				</div>
				<span>Victoires</span>
			</div>
			<div class="summary_card">
				<div class="summary_main">
					<span class="summary_icon skull">☠</span>
					<strong>84</strong>
				</div>
				<span>Défaites</span>
			</div>
			<div class="summary_card">
				<div class="summary_main">
					<span class="summary_icon">★</span>
					<strong>70%</strong>
				</div>
				<span>Taux de victoire</span>
			</div>
		</section>
		<section class="stats_middle">
			<div class="stats_box modes_box">
				<h2>Répartition par mode de jeu</h2>
				<div class="mode_distribution">
					<div class="donut"></div>
					<div class="mode_legend">
						{#each statsModes as mode}
							<div class="legend_line">
								<span class="legend_dot" style={`background:${mode.color}`}></span>
								<span class="legend_name">{mode.name}</span>
								<strong>{mode.value}%</strong>
							</div>
						{/each}
					</div>
				</div>
			</div>
			<div class="stats_box rank_box">
				<div class="rank_header">
					<h2>Évolution du rang</h2>
					<select>
						<option>6 derniers mois</option>
					</select>
				</div>
				<div class="rank_chart">
					<div class="rank_labels">
						<span>Maître</span>
						<span>Expert</span>
						<span>Adepte</span>
						<span>Disciple</span>
						<span>Novice</span>
					</div>
					<div class="rank_graph">
						<svg viewBox="0 0 100 100" preserveAspectRatio="none">
							{#each [18, 38, 58, 78] as y}
								<line x1="0" y1={y} x2="100" y2={y} class="rank_grid_line"/>
							{/each}
							<polyline points={rankPolyline} class="rank_line"/>
							{#each rankProgress as point}
								<circle cx={point.x} cy={point.y} r="1.8" class="rank_point"/>
							{/each}
						</svg>
						<div class="rank_months">
							{#each rankProgress as point}
								<span>{point.month}</span>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</section>
		<section class="stats_bottom">
			<div class="stats_box ranking_box">
				<h2>Cartes les plus jouées</h2>
				{#each mostPlayedCards as card}
					<div class="ranking_row">
						<span class="ranking_position">{card.rank}</span>
						<img class="ranking_card_image" src={card.image} alt={card.name}/>
						<span class="ranking_name">{card.name}</span>
						<span class="ranking_games">{card.games} parties</span>
					</div>
				{/each}
			</div>
			<div class="stats_box ranking_box">
				<h2>Adversaires fréquents</h2>
				{#each frequentOpponents as opponent}
					<div class="ranking_row opponent_row">
						<span class="ranking_position">{opponent.rank}</span>
						<img class="opponent_avatar" src={opponent.avatar} alt={opponent.name}/>
						<span class="ranking_name">{opponent.name}</span>
						<span class="ranking_games">{opponent.games} parties</span>
					</div>
				{/each}
			</div>
			<div class="stats_right_bottom">
				<div class="stats_box hourly_box">
					<h2> Performance par heure</h2>
					<div class="bar_chart">
						<div class="bar_scale">
							<span>100%</span>
							<span>75%</span>
							<span>25%</span>
							<span>0%</span>
						</div>
						<div class="bars">
							{#each hourlyStats as hour, index}
								<div class="bar_column">
									<div class:red_bar={index >= 6 && index <= 7} class="bar" style={`height:${hour.value}%`}></div>
									<span>{hour.label}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
				<div class="stats_quote_bottom">
					<p>« Chaque partie est une leçon. »</p>
					<span>— 御 寺 間 —</span>
					<div class="stats_quote_stamp">棋</div>
				</div>
			</div>
		</section>
	</section>
</main>

<style>
	.stats_page {
		/* Position */
		position: fixed;
		top: var(--topbar-height);
		left: 0;
		z-index: 10;

		/* Lenght */
		width: calc(100vw - var(--friends-width));
		height: calc(100vh - var(--topbar-height));
		grid-template-columns: clamp(185px, 15vw, 225px) minmax(0, 1fr);

		/* Display */
		display: grid;
		color: #1b1510;
		overflow: hidden;
	}

	.stats_sidebar {
		/* Position */
		position: relative;

		/* Lenght */
		height: 100%;

		/* Alignement */
		padding: clamp(25px, 3vh, 40px) 18px 25px 28px;

		/* Display */
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.stats_kanji {
		/* Alignement */
		margin-bottom: 25px;

		/* Display */
		color: #120e0b;

		/* Text */
		font-family: "Times New Roman", serif;
		font-size: clamp(80px, 7vw, 115px);
		font-weight: 700;
		line-height: 0.9;
	}

	.stats_side_quote {
		/* Alignement */
		margin-bottom: 16px;

		/* Text */
		font-family: Georgia, serif;
		font-size: clamp(13px, 1vw, 17px);
		line-height: 1.45;
	}

	.stats_stamp,
	.stats_quote_stamp {
		/* Lenght */
		width: 47px;
		height: 55px;

		/* Alignement */
		align-items: center;

		/* Display */
		display: flex;
		color: #f1d4b2;
		justify-content: center;

		/* Background */
		background: #a41e1b;

		/* Border */
		border-radius: 4px;
		border: 2px solid #b3322d;

		/* Text */
		font-size: 27px;
	}

	.stats_stamp {
		/* Alignement */
		margin: 0 auto 25px;
	}

	.stats_filters {
		/* Alignement */
		gap: 5px;

		/* Display */
		display: flex;
		flex-direction: column;
	}

	.stats_filters button {
		/* Position */
		position: relative;

		/* Lenght */
		min-height: 42px;

		/* Alignement */
		padding: 7px 12px;

		/* Display */
		color: #211812;

		/* Animation */
		transition: transform 140ms ease;

		/* Border */
		border: none;

		/* Background */
		background: transparent;

		/* Cursor */
		cursor: pointer;

		/* Text */
		text-align: left;
		font-family: Georgia, serif;
		font-size: clamp(13px, 1vw, 16px);
	}

	.stats_filters button:hover {
		/* Animation */
		transform: translateX(4px);
	}

	.stats_filters button.active {
		/* Display */
		color: #f3dbc0;

		/* Background */
		background: linear-gradient(90deg, #711310, #a4231e, #69110e);

		/* Border */
		border-radius: 50% 9% 45% 12% / 35% 50% 30% 45%;
	}

	.stats_content {
		/* Lenght */
		min-width: 0;
		min-height: 0;
		height: 100%;
		grid-template-rows: auto auto minmax(220px, 1fr) minmax(270px, 1.35fr);

		/* Alignement */
		gap: clamp(10px, 1.2vh, 16px);
		padding: clamp(45px, 6vh, 65px) clamp(25px, 2.5vw, 38px) 35px 0;

		/* Display */
		display: grid;
	}

	.stats_header h1 {
		/* Alignement */
		margin: 0;

		/* Text */
		font-family: Georgia, serif;
		font-size: clamp(27px, 2.3vw, 36px);
	}

	.stats_header p {
		/* Alignement */
		margin: 7px 0 0;

		/* Text */
		font-family: Georgia, serif;
		font-size: clamp(14px, 1.2vw, 20px);
	}

	.stats_summary {
		/* Lenght */
		grid-template-columns: repeat(4, minmax(0, 1fr));

		/* Alignement */
		gap: 10px;

		/* Display */
		display: grid;
	}

	.summary_card,
	.stats_box,
	.stats_quote_bottom {
		/* Background */
		background: rgba(243, 224, 194, 0.28);

		/* Border */
		border: 1px solid rgba(82, 59, 39, 0.35);
		border-radius: 5px;
	}

	.summary_card {
		/* Lenght */
		min-height: clamp(95px, 12vh, 120px);

		/* Alignement */
		align-items: center;
		gap: 10px;

		/* Display */
		display: flex;
		flex-direction: column;
		justify-content: center;

		/* Text */
		font-family: Georgia, serif;
	}

	.summary_main {
		/* Alignement */
		align-items: center;
		gap: 18px;

		/* Display */
		display: flex;

		/* Text */
		font-size: clamp(25px, 2vw, 32px);
	}

	.summary_main strong {
		/* Text */
		font-size: clamp(24px, 2vw, 32px);
	}

	.summary_main.red {
		/* Display */
		color: #b31818;
	}

	.summary_icon {
		/* Text */
		font-size: clamp(32px, 3vw, 45px);
		line-height: 1;
	}

	.summary_card > span {
		/* Text */
		font-size: clamp(14px, 1.15vw, 18px);
	}

	.stats_middle {
		/* Lenght */
		min-height: 0;
		grid-template-columns: minmax(320px, 0.78fr) minmax(430px, 1.05fr);

		/* Alignement */
		gap: 10px;

		/* Display */
		display: grid;
	}

	.stats_box {
		/* Lenght */
		min-width: 0;
		min-height: 0;

		/* Alignement */
		padding: 14px 20px;

		/* Display */
		overflow: hidden;
	}

	.stats_box h2 {
		/* Alignement */
		margin: 0 0 14px;

		/* Text */
		font-family: Georgia, serif;
		font-size: clamp(15px, 1.25vw, 20px);
	}

	.mode_distribution {
		/* Lenght */
		height: calc(100% - 35px);
		grid-template-columns: minmax(135px, 1fr) minmax(150px, 0.9fr);

		/* Alignement */
		align-items: center;
		gap: 15px;

		/* Display */
		display: grid;
	}

	.donut {
		/* Position */
		position: relative;

		/* Lenght */
		width: clamp(125px, 12vw, 160px);

		/* Display */
		aspect-ratio: 1;
		justify-self: center;

		/* Background */
		background:conic-gradient(#8d0909 0% 42%, #343434 42% 70%, #777777 70% 88%, #171717 88% 100%);

		/* Border */
		border-radius: 50%;
	}

	.donut::after {
		/* Position */
		position: absolute;
		inset: 28%;

		/* Display */
		content: "";

		/* Background */
		background: #ead6b8;

		/* Border */
		border-radius: 50%;
	}

	.mode_legend {
		/* Alignement */
		gap: 14px;

		/* Display */
		display: flex;
		flex-direction: column;

		/* Text */
		font-family: Georgia, serif;
	}

	.legend_line {
		/* Lenght */
		grid-template-columns: 13px 1fr auto;

		/* Alignement */
		align-items: center;
		gap: 10px;

		/* Display */
		display: grid;

		/* Text */
		font-size: clamp(12px, 0.95vw, 15px);
	}

	.legend_dot {
		/* Lenght */
		width: 12px;
		height: 12px;

		/* Border */
		border-radius: 50%;
	}

	.rank_box {
		/* Display */
		display: flex;
		flex-direction: column;
	}

	.rank_header {
		/* Alignement */
		align-items: center;

		/* Display */
		display: flex;
		justify-content: space-between;
	}

	.rank_header h2 {
		/* Alignement */
		margin-bottom: 0;
	}

	.rank_header select {
		/* Alignement */
		padding: 6px 35px 6px 12px;

		/* Background */
		background: rgba(245, 227, 199, 0.5);

		/* Border */
		border: 1px solid rgba(67, 48, 33, 0.4);
		border-radius: 5px;

		/* Text */
		font-family: Georgia, serif;
	}

	.rank_chart {
		/* Lenght */
		min-height: 0;
		grid-template-columns: 65px minmax(0, 1fr);

		/* Alignement */
		margin-top: 15px;

		/* Display */
		display: grid;
		flex: 1;
	}

	.rank_labels {
		/* Alignement */
		padding: 10px 5px 26px 0;

		/* Display */
		display: flex;
		flex-direction: column;
		justify-content: space-between;

		/* Text */
		font-family: Georgia, serif;
		font-size: clamp(10px, 0.8vw, 13px);
	}

	.rank_graph {
		/* Position */
		position: relative;

		/* Lenght */
		min-height: 0;
	}

	.rank_graph svg {
		/* Position */
		position: absolute;
		inset: 0 0 25px 0;

		/* Lenght */
		width: 100%;
		height: calc(100% - 25px);

		/* Display */
		overflow: visible;
	}

	.rank_grid_line {
		/* Object */
		stroke: rgba(70, 53, 38, 0.15);
		stroke-width: 0.4;
	}

	.rank_line {
		/* Object */
		fill: none;
		stroke: #aa1715;
		stroke-width: 1.5;
		vector-effect: non-scaling-stroke;
	}

	.rank_point {
		/* Object */
		fill: #bf1b18;
	}

	.rank_months {
		/* Position */
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;

		/* Lenght */
		grid-template-columns: repeat(6, 1fr);

		/* Display */
		display: grid;

		/* Text */
		font-family: Georgia, serif;
		font-size: clamp(9px, 0.75vw, 12px);
		text-align: center;
	}

	.stats_bottom {
		/* Lenght */
		min-height: 0;
		grid-template-columns: minmax(260px, 1fr) minmax(245px, 0.92fr) minmax(300px, 1.05fr);

		/* Alignement */
		gap: 10px;

		/* Display */
		display: grid;
	}

	.ranking_box {
		/* Display */
		display: flex;
		flex-direction: column;
	}

	.ranking_row {
		/* Lenght */
		min-height: 0;
		grid-template-columns: 22px 72px minmax(0, 1fr) auto;

		/* Alignement */
		align-items: center;
		gap: 8px;

		/* Display */
		display: grid;
		flex: 1;

		/* Border */
		border-top: 1px solid rgba(80, 58, 39, 0.12);

		/* Text */
		font-family: Georgia, serif;
		font-size: clamp(10px, 0.85vw, 14px);
	}

	.ranking_position {
		/* Text */
		text-align: center;
	}

	.ranking_card_image {
		/* Lenght */
		width: 70px;
		height: 39px;

		/* Object */
		object-fit: cover;
	}

	.opponent_row {
		/* Lenght */
		grid-template-columns: 22px 43px minmax(0, 1fr) auto;
	}

	.opponent_avatar {
		/* Lenght */
		width: 39px;
		height: 39px;

		/* Border */
		border-radius: 50%;

		/* Object */
		object-fit: cover;
	}

	.ranking_name,
	.ranking_games {
		/* Text */
		white-space: nowrap;
	}

	.stats_right_bottom {
		/* Lenght */
		min-height: 0;
		grid-template-rows: minmax(0, 1fr) auto;

		/* Alignement */
		gap: 10px;

		/* Display */
		display: grid;
	}

	.hourly_box {
		/* Display */
		display: flex;
		flex-direction: column;
	}

	.bar_chart {
		/* Lenght */
		min-height: 0;
		grid-template-columns: 38px minmax(0, 1fr);

		/* Display */
		display: grid;
		flex: 1;
	}

	.bar_scale {
		/* Alignement */
		padding-bottom: 22px;

		/* Display */
		display: flex;
		flex-direction: column;
		justify-content: space-between;

		/* Text */
		font-family: Georgia, serif;
		font-size: 10px;
	}

	.bars {
		/* Lenght */
		min-height: 0;
		grid-template-columns: repeat(11, 1fr);

		/* Alignement */
		align-items: end;
		gap: 3px;

		/* Display */
		display: grid;

		/* Background */
		background:repeating-linear-gradient(to top, transparent 0, transparent 24%, rgba(65, 47, 33, 0.08) 25%);

		/* Border */
		border-bottom: 1px solid rgba(60, 45, 32, 0.35);
	}

	.bar_column {
		/* Lenght */
		height: 100%;
		min-width: 0;

		/* Alignement */
		align-items: center;

		/* Display */
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.bar {
		/* Lenght */
		width: 75%;
		min-height: 3px;

		/* Background */
		background: #1c1a17;
	}

	.bar.red_bar {
		/* Background */
		background: #b71916;
	}

	.bar_column span {
		/* Lenght */
		height: 20px;

		/* Alignement */
		align-items: flex-end;

		/* Lenght */
		display: flex;

		/* Text */
		font-family: Georgia, serif;
		font-size: 9px;
	}

	.stats_quote_bottom {
		/* Position */
		position: relative;

		/* Lenght */
		min-height: 90px;

		/* Alignement */
		align-items: center;
		padding: 10px 55px 10px 15px;

		/* Display */
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.stats_quote_bottom p {
		/* Alignement */
		margin: 0;

		/* Text */
		font-family: cursive;
		font-style: italic;
		font-size: clamp(16px, 1.5vw, 24px);
		text-align: center;
	}

	.stats_quote_bottom > span {
		/* Alignement */
		margin-top: 7px;

		/* Text */
		font-family: Georgia, serif;
		font-size: 13px;
	}

	.stats_quote_stamp {
		/* Position */
		position: absolute;
		right: 15px;
		bottom: 10px;

		/* Lenght */
		width: 38px;
		height: 44px;

		/* Text */
		font-size: 22px;
	}

	@media (max-width: 1250px) {
		.stats_page {grid-template-columns: 175px minmax(0, 1fr);}
		.stats_content {padding-right: 20px;}
		.stats_middle {grid-template-columns: 0.8fr 1fr;}
		.stats_bottom {grid-template-columns: 1fr 1fr;}
		.stats_right_bottom {grid-column: 1 / -1;grid-template-columns: 1fr 0.7fr;grid-template-rows: 1fr;}
		.ranking_card_image {width: 55px;}
	}

</style>