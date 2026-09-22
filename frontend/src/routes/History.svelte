<script lang="ts">

	let historyFilter = "all";
	let historyPage = 1;

	function HistoryFilterChange(filter: string)
	{
		historyFilter = filter;
		console.log(historyFilter);
	}

	function HistoryPageChange(page: number) {
		historyPage = page;
		console.log(historyPage);
	}

	function getModeLabel(mode: string) {
		switch (mode)
		{
			case "Ranked":
				return "Classée";
			case "Normal":
				return "Normale";
			case "Challenge":
				return "Défis";
			case "Event":
				return "Événement";
			default:
				return mode;
		}
	}

	const History_Game_Test = 
	[{result: "Victory", mode: "Ranked", opponent: "RaiNeko", avatar: "../assets/raineko.png", duration: "12 min", date: "Aujourd’hui 14:32"},
	{result: "Defeat", mode: "Normal", opponent: "Tsuki", avatar: "../assets/tsuki.png", duration: "18 min", date: "Aujourd’hui 12:14"},
	{result: "Victory", mode: "Challenge", opponent: "Daiko", avatar: "../assets/daiko.png", duration: "9 min", date: "Hier 22:01"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/mei.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Defeat",mode: "Event",opponent: "Akemi",avatar: "../assets/akemi.png",duration: "15 min",date: "12/04/2025"}];

</script>

<main class="history_page">
	<aside class="history_sidebar">
		<div class="history_kanji"> 戦 </div>
		<nav class="history_filters">
			<button class:active={historyFilter === "all"} onclick={() => HistoryFilterChange("all")}> Toutes </button>
			<button class:active={historyFilter === "ranked"} onclick={() => HistoryFilterChange("ranked")}> Classées </button>
			<button class:active={historyFilter === "normal"} onclick={() => HistoryFilterChange("normal")}> Normales </button>
			<button class:active={historyFilter === "challenge"} onclick={() => HistoryFilterChange("challenge")}> Défis </button>
			<button class:active={historyFilter === "event"} onclick={() => HistoryFilterChange("event")}> Événements </button>
		</nav>
		<div class="history_sidebar_quote">
			<p> « Apprendre<br> d’hier pour mieux<br> jouer demain. »</p>
			<div class="history_stamp"> 棋 </div>
		</div>
	</aside>
	<section class="history_content">
		<header class="history_header">
			<h1> Historique des parties </h1>
			<p> « Chaque partie laisse une trace. » </p>
		</header>
		<section class="history_table">
			<div class="history_table_header">
				<div> RÉSULTAT </div>
				<div> MODE </div>
				<div> ADVERSAIRE </div>
				<div> DURÉE </div>
				<div> DATE </div>
				<div></div>
			</div>
			<div class="history_rows">
				{#each History_Game_Test as game}
					<div class="history_row">
						<div class="history_result">
							{#if game.result === "Victory"}
								<span class="result_icon victory_icon"> ♨ </span>
								<strong class="victory_text"> Victoire </strong>
							{:else}
								<span class="result_icon defeat_icon"> ♦ </span>
								<strong class="defeat_text"> Défaite </strong>
							{/if}
						</div>
						<div class="history_mode">
							{#if game.mode === "Ranked"}
								<span class="mode_icon"> ♛ </span>
							{:else if game.mode === "Normal"}
								<span class="mode_icon"> ⚔ </span>
							{:else if game.mode === "Challenge"}
								<span class="mode_icon"> ▣ </span>
							{:else}
								<span class="mode_icon"> ✿ </span>
							{/if}
							<span> {getModeLabel(game.mode)} </span>
						</div>
						<div class="history_opponent">
							<img src={game.avatar} alt={game.opponent}/>
							<span>{game.opponent}</span>
						</div>
						<div class="history_duration">{game.duration}</div>
						<div class="history_date">{game.date}</div>
						<div class="history_options">
							<button aria-label={`Options de la partie contre ${game.opponent}`}> ••• </button>
						</div>
					</div>
				{/each}
			</div>
		</section>
		<nav class="history_pagination">
			<button class="pagination_arrow" onclick={() => HistoryPageChange(Math.max(1, historyPage - 1))}> ‹ </button>
			{#each [1, 2, 3, 4, 5] as page}
				<button class:active={historyPage === page} onclick={() => HistoryPageChange(page)}> {page}</button>
			{/each}
			<span> … </span>
			<button class="pagination_arrow" onclick={() => HistoryPageChange(historyPage + 1)}> › </button>
		</nav>
	</section>
</main>

<style>
	.history_page {
		/* Position */
		position: fixed;
		top: var(--topbar-height);
		left: 0;
		z-index: 10;

		/* Lenght */
		width:calc(100vw - var(--friends-width));
		height:calc(100vh - var(--topbar-height));
		grid-template-columns:clamp(165px,13.5vw,210px) minmax(0, 1fr);

		/* Display */
		display: grid;
		color: #1c1611;
		overflow: hidden;
	}

	.history_sidebar {
		/* Position */
		position: relative;

		/* Lenght */
		width: 100%;
		height: 100%;

		/* Alignement */
		padding:clamp(25px, 3vh, 40px) 18px 25px 25px;

		/* Display */
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.history_kanji {
		/* Alignement */
		margin-bottom:clamp(25px, 4vh, 42px);

		/* Display */
		color: #15100d;

		/* Text */
		font-family:"Times New Roman", serif;
		font-size:clamp(75px, 7vw, 115px);
		font-weight: 700;
		line-height: 0.9;

		/* Cursor */
		user-select: none;
	}

	.history_filters {
		/* Alignement */
		align-items: stretch;
		gap: 8px;

		/* Display */
		display: flex;
		flex-direction: column;
	}

	.history_filters button {
		/* Position */
		position: relative;

		/* Lenght */
		min-height: 42px;

		/* Alignement */
		padding:7px 15px;

		/* Display */
		color: #241a14;

		/* Animation */
		transition:transform 140ms ease, background 140ms ease, color 140ms ease;

		/* Background */
		background: transparent;

		/* Border */
		border: none;
		outline: none;

		/* Cursor */
		cursor: pointer;

		/* Text */
		text-align: left;
		font-family: Georgia, serif;
		font-size:clamp(14px, 1.05vw, 17px);
	}

	.history_filters button:hover {
		/* Animation */
		transform:translateX(4px);
	}

	.history_filters button.active {
		/* Display */
		color: #f1ddc1;

		/* Animation */
		transform:rotate(-1deg);

		/* Background */
		background:linear-gradient(90deg, #701713, #9c211d, #681310);

		/* Border */
		border-radius:55% 8% 50% 10% / 30% 45% 35% 50%;
	}

	.history_sidebar_quote {
		/* Alignement */
		margin-top: auto;
		padding: 20px 10px;

		/* Display */
		color:#33251b;

		/* Text */
		font-family: Georgia, serif;
		font-size:clamp(12px, 0.95vw, 15px);
		line-height: 1.45;
	}

	.history_sidebar_quote p {
		/* Alignement */
		margin: 0;
	}

	.history_stamp {
		/* Lenght */
		width: 43px;
		height: 51px;

		/* Alignement */
		align-items: center;
		margin:20px auto 0;

		/* Display */
		display: flex;
		color: #f3d4b1;
		justify-content: center;

		/* Background */
		background:#a22520;

		/* Border */
		border:3px solid #a22520;
		border-radius: 4px;

		/* Text */
		font-size: 26px;
	}

	.history_content {
		/* Lenght */
		min-width: 0;
		min-height: 0;
		width: 100%;
		height: 100%;
		grid-template-rows:auto minmax(0, 1fr)auto;

		/* Alignement */
		padding:clamp(45px,7vh,75px)clamp(35px,4vw,65px)clamp(25px,4vh,45px) 0;

		/* Display */
		display: grid;
	}

	.history_header {
		/* Alignement */
		margin-bottom:clamp(12px,2vh,20px);
	}

	.history_header h1 {
		/* Alignement */
		margin: 0;

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(25px,2.3vw,36px);
		font-weight: 700;
	}

	.history_header p {
		/* Alignement */
		margin:8px 0 0;

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(14px, 1.25vw, 20px);
	}

	.history_table {
		/* Lenght */
		min-height: 0;
		width: 100%;
		grid-template-rows:auto minmax(0, 1fr);

		/* Display */
		display: grid;
	}

	.history_table_header {
		/* Lenght */
		height:clamp(40px,5vh,48px);
		grid-template-columns:1.1fr 1fr 1.3fr 0.75fr 1.05fr 45px;

		/* Alignement */
		align-items: center;
		padding: 0 18px;

		/* Display */
		display: grid;
		color:#eee2cf;

		/* Background */
		background:#181512;

		/* Border */
		border-radius: 50% 6px 40% 8px / 15% 10% 18% 10%;
		box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.025);

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(12px,0.95vw,16px);
	}

	.history_rows {
		/* Lenght */
		min-height: 0;

		/* Display */
		overflow-y: auto;

		/* Scrollbar */
		scrollbar-width: thin;
		scrollbar-color:rgba(45, 34, 25, 0.35)transparent;
	}

	.history_row {
		/* Lenght */
		min-height:clamp(48px,5.7vh,58px);
		grid-template-columns: 1.1fr 1fr 1.3fr 0.75fr 1.05fr 45px;

		/* Alignement */
		align-items: center;
		padding: 0 18px;

		/* Display */
		display: grid;

		/* Animation */
		transition:background 130ms ease, transform 130ms ease;

		/* Background */
		background:rgba(244, 224, 195, 0.12);

		/* Border */
		border-bottom: 1px solid rgba(72, 52, 35, 0.25);

		/* Text */
		font-family: Georgia, serif;
		font-size:clamp(12px, 1vw, 16px);
	}

	.history_row:hover {
		/* Animation */
		transform:translateX(2px);

		/* Background */
		background:rgba(245, 224, 194, 0.48);
	}

	.history_result {
		/* Alignement */
		align-items: center;
		gap: 12px;

		/* Display */
		display: flex;
	}

	.result_icon {
		/* Lenght */
		width: 28px;

		/* Alignement */
		align-items: center;

		/* Display */
		display: flex;
		justify-content: center;

		/* Text */
		font-size:clamp(20px,1.7vw,28px);
	}

	.victory_text,
	.victory_icon {
		/* Display */
		color:#16813e;
	}


	.defeat_text,
	.defeat_icon {
		/* Display */
		color:#bd2a25;
	}

	.result_asset {
		/* Lenght */
		width: 27px;
		height: 27px;

		/* Object */
		object-fit: contain;
	}

	.history_mode {
		/* Alignement */
		align-items: center;
		gap: 12px;

		/* Display */
		display: flex;
	}

	.mode_icon {
		/* Lenght */
		width: 25px;

		/* Alignement */
		align-items: center;

		/* Display */
		display: flex;
		color: #17130f;
		justify-content: center;

		/* Text */
		font-size:clamp(19px,1.5vw,25px);
	}

	.history_opponent {
		/* Lenght */
		min-width: 0;

		/* Alignement */
		align-items: center;
		gap:clamp(8px, 0.8vw, 12px);

		/* Display */
		display: flex;
	}

	.history_opponent img {
		/* Lenght */
		width:clamp(34px, 2.8vw, 42px);
		height:clamp(34px,2.8vw,42px);

		/* Display */
		flex-shrink: 0;

		/* Border */
		border-radius: 50%;

		/* Object */
		object-fit: cover;
	}

	.history_opponent span {
		/* Display */
		overflow: hidden;

		/* Text */
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.history_duration,
	.history_date {
		/* Text */
		white-space: nowrap;
	}

	.history_options {
		/* Alignement */
		align-items: center;

		/* Display */
		display: flex;
		justify-content: center;
	}

	.history_options button {
		/* Lenght */
		width: 35px;
		height: 35px;

		/* Alignement */
		align-items: center;

		/* Display */
		display: flex;
		color: #17130f;
		justify-content: center;

		/* Animation */
		transition:transform 130ms ease;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Cursor */
		cursor: pointer;

		/* Text */
		font-size: 18px;
	}


	.history_options button:hover {
		/* Animation */
		transform:scale(1.18);
	}

	.history_pagination {
		/* Lenght */
		min-height:clamp(60px,8vh,85px);

		/* Alignement */
		align-items: center;
		gap:clamp(8px,1vw,14px);
		padding-top: 10px;

		/* Display */
		display: flex;
		justify-content: center;
	}

	.history_pagination button {
		/* Lenght */
		min-width: 36px;
		height: 40px;

		/* Alignement */
		padding:0 8px;

		/* Display */
		color:#1f1711;

		/* Animation */
		transition:background 130ms ease, color 130ms ease, transform 130ms ease;

		/* Bakcground */
		background: transparent;

		/* Border */
		border: none;
		border-radius: 4px;

		/* Cursor */
		cursor: pointer;

		/* Text */
		font-family: Georgia, serif;
		font-size:clamp(14px,1.1vw,17px);
	}

	.history_pagination button.active {
		/* Display */
		color:#f6dfc1;

		/* Background */
		background:#a8231e;
	}

	.history_pagination button:hover {
		/* Animation */
		transform:translateY(-2px);
	}

	.history_pagination .pagination_arrow {
		/* Text */
		font-size: 30px;
	}

</style>