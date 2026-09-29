<script lang="ts">

	import History_Details from './History_Details.svelte';

	type Game = {
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

	let historyFilter = "all";
	let historyPage = 1;
	let	GameOption: Game | null = null;

	function HistoryFilterChange(filter: string)
	{
		historyFilter = filter;
		// console.log(historyFilter);
	}

	function HistoryPageChange(page: number) {
		historyPage = page;
		// console.log(historyPage);
	}

	function getModeLabel(mode: string) {
		switch (mode)
		{
			case "Ranked":
				return "Classée";
			case "Normal":
				return "Normale";
			case "Training":
				return "Training";
			default:
				return mode;
		}
	}

	const History_Game_Test = 
	[{result: "Victory", mode: "Ranked", opponent: "RaiNeko", avatar: "../assets/home/avatar/daiko.png", duration: "12 min", date: "Aujourd’hui 14:32"},
	{result: "Defeat", mode: "Normal", opponent: "Tsuki", avatar: "../assets/home/avatar/daiko.png", duration: "18 min", date: "Aujourd’hui 12:14"},
	{result: "Victory", mode: "Training", opponent: "Daiko", avatar: "../assets/home/avatar/daiko.png", duration: "9 min", date: "Hier 22:01"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Defeat",mode: "Training",opponent: "Akemi",avatar: "../assets/home/avatar/daiko.png",duration: "15 min",date: "12/04/2025"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/home/avatar/daiko.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Defeat", mode: "Normal", opponent: "Tsuki", avatar: "../assets/home/avatar/daiko.png", duration: "18 min", date: "Aujourd’hui 12:14"}];

</script>

<main class="History_page">
	<aside class="History_sidebar">
		<br><br><br><br><br>
		<!-- <div class="history_kanji"> 戦 </div> -->
		<nav class="History_filters">
			<button class:active={historyFilter === "all"} onclick={() => HistoryFilterChange("all")}> Toutes </button>
			<button class:active={historyFilter === "Ranked"} onclick={() => HistoryFilterChange("Ranked")}> Classées </button>
			<button class:active={historyFilter === "Normal"} onclick={() => HistoryFilterChange("Normal")}> Normales </button>
			<button class:active={historyFilter === "Training"} onclick={() => HistoryFilterChange("Training")}> Entrainement </button>
		</nav>
		<div class="History_sidebar_quote">
			<p> « Apprendre<br> d’hier pour mieux<br> jouer demain. »</p>
			<div class="History_stamp"> 棋 </div>
		</div>
	</aside>
	<section class="History_content">
		<header class="History_header">
			<h1> Historique des parties </h1>
			<p> « Chaque partie laisse une trace. » </p>
		</header>
		<section class="History_table">
			<div class="History_table_header">
				<div> RÉSULTAT </div>
				<div> MODE </div>
				<div> ADVERSAIRE </div>
				<div> DURÉE </div>
				<div> DATE </div>
				<div></div>
			</div>
			<div class="History_rows">
				{#each History_Game_Test as game}
					{#if game.mode === historyFilter || historyFilter === "all"}
						<div class="History_row">
							<!-- {#if historyFilter === "all"} -->
							<div class="History_result">
								{#if game.result === "Victory"}
									<img src="../assets/home/icone/victoire.png"/>
									<!-- <span class="result_icon victory_icon"> ♨ </span> -->
									<strong class="Victory_text"> Victoire </strong>
								{:else}
									<img src="../assets/home/icone/defaite.png"/>
									<!-- <span class="result_icon defeat_icon"> ♦ </span> -->
									<strong class="Defeat_text"> Défaite </strong>
								{/if}
							</div>
							<div class="History_mode">
								{#if game.mode === "Ranked"}
									<span class="Mode_icon"> ♛ </span>
								{:else if game.mode === "Normal"}
									<span class="Mode_icon"> ⚔ </span>
								{:else if game.mode === "Training"}
									<span class="Mode_icon"> ▣ </span>
								{/if}
								<span> {getModeLabel(game.mode)} </span>
							</div>
							<div class="History_opponent">
								<img src={game.avatar} alt={game.opponent}/>
								<span>{game.opponent}</span>
							</div>
							<div class="History_duration">{game.duration}</div>
							<div class="History_date">{game.date}</div>
							<div class="History_options">
								<button onclick={() => GameOption = game} aria-label={`Options de la partie contre ${game.opponent}`}> ••• </button>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</section>
		<nav class="History_pagination">
			<!-- <button class="pagination_arrow" onclick={() => HistoryPageChange(Math.max(1, historyPage - 1))}> ‹ </button>
			{#each [1, 2, 3, 4, 5] as page}
				<button class:active={historyPage === page} onclick={() => HistoryPageChange(page)}> {page}</button>
			{/each}
			<span> … </span>
			<button class="pagination_arrow" onclick={() => HistoryPageChange(historyPage + 1)}> › </button> -->
		</nav>
	</section>
</main>

{#if GameOption}
	<History_Details game={GameOption} onclose={()=>GameOption=null}/>
{/if}

<style>
	.History_page {
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

	.History_sidebar {
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

		/* background: url("../assets/Tori.png"); */
		/* background-size: 50%; */
		background: no-repeat bottom/100% url("../assets/Tori.png");
	}

	.History_kanji {
		/* Alignement */
		margin-bottom:clamp(25px, 4vh, 42px);

		/* Display */
		color: #15100d;

		/* Cursor */
		user-select: none;

		/* Text */
		font-family:"Times New Roman", serif;
		font-size:clamp(75px, 7vw, 115px);
		font-weight: 700;
		line-height: 0.9;
	}

	.History_filters {
		/* Alignement */
		align-items: stretch;
		gap: 8px;

		/* Display */
		display: flex;
		flex-direction: column;
	}

	.History_filters button {
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

	.History_filters button:hover {
		/* Animation */
		transform:translateX(4px);
	}

	.History_filters button.active {
		/* Display */
		color: #f1ddc1;

		/* Animation */
		transform:rotate(-1deg);

		/* Background */
		background:linear-gradient(90deg, #701713, #9c211d, #681310);

		/* Border */
		border-radius:55% 8% 50% 10% / 30% 45% 35% 50%;
	}

	.History_sidebar_quote {
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

	.History_sidebar_quote p {
		/* Alignement */
		margin: 0;
	}

	.History_stamp {
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

	.History_content {
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

	.History_header {
		/* Alignement */
		margin-bottom:clamp(12px,2vh,20px);
	}

	.History_header h1 {
		/* Alignement */
		margin: 0;

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(25px,2.3vw,36px);
		font-weight: 700;
	}

	.History_header p {
		/* Alignement */
		margin:8px 0 0;

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(14px, 1.25vw, 20px);
	}

	.History_table {
		/* Lenght */
		min-height: 0;
		width: 100%;
		grid-template-rows:auto minmax(0, 1fr);

		/* Display */
		display: grid;
	}

	.History_table_header {
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

	.History_rows {
		/* Lenght */
		min-height: 0;

		/* Display */
		overflow-y: auto;

		/* Scrollbar */
		scrollbar-width: thin;
		scrollbar-color:rgba(45, 34, 25, 0.35)transparent;
	}

	.History_row {
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

	.History_row:hover {
		/* Animation */
		transform:translateX(2px);

		/* Background */
		background:rgba(245, 224, 194, 0.48);
	}

	.History_result {
		/* Alignement */
		align-items: center;
		gap: 12px;

		/* Display */
		display: flex;
	}

	.Result_icon {
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

	.Victory_text,
	.Victory_icon {
		/* Display */
		color:#16813e;
	}


	.Defeat_text,
	.Defeat_icon {
		/* Display */
		color:#bd2a25;
	}

	.Result_asset {
		/* Lenght */
		width: 27px;
		height: 27px;

		/* Object */
		object-fit: contain;
	}

	.History_mode {
		/* Alignement */
		align-items: center;
		gap: 12px;

		/* Display */
		display: flex;
	}

	.Mode_icon {
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

	.History_opponent {
		/* Lenght */
		min-width: 0;

		/* Alignement */
		align-items: center;
		gap:clamp(8px, 0.8vw, 12px);

		/* Display */
		display: flex;
	}

	.History_opponent img {
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

	.History_opponent span {
		/* Display */
		overflow: hidden;

		/* Text */
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.History_duration,
	.History_date {
		/* Text */
		white-space: nowrap;
	}

	.History_options {
		/* Alignement */
		align-items: center;

		/* Display */
		display: flex;
		justify-content: center;
	}

	.History_options button {
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


	.History_options button:hover {
		/* Animation */
		transform:scale(1.18);
	}

	.History_pagination {
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

	.History_pagination button {
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

	.History_pagination button.active {
		/* Display */
		color:#f6dfc1;

		/* Background */
		background:#a8231e;
	}

	.History_pagination button:hover {
		/* Animation */
		transform:translateY(-2px);
	}

	.History_pagination .pagination_arrow {
		/* Text */
		font-size: 30px;
	}

</style>