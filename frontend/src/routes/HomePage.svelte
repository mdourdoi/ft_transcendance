<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import Search from "@lucide/svelte/icons/search";
  import SettingsIcone from "@lucide/svelte/icons/settings";
  import Notification from "@lucide/svelte/icons/bell";
  import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import Autoplay from "embla-carousel-autoplay";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Carousel from "$lib/components/ui/carousel/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
//   import App from "src/App.svelte";
 
  const tags = Array.from({ length: 50 }).map(
    (_, i, a) => `v1.2.0-beta.${a.length - i}`
  );

  const plugin = Autoplay({ delay: 1900, stopOnInteraction: true });

	let onglet = "home";
	let historyFilter = "all";
	let historyPage = 1;

  	function OngletChange (Mode: string)
	{
    	onglet = Mode;
    	console.log(onglet);
  	}

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
	
	const	Friends_Test =
	[{login: "Test_Online", status: "Online", avatar: "../assets/test-inline.png"},
	{login: "Test_InGame", status: "InGame", avatar: "../assets/test-afk.png"},
	{login: "Test_Afk", status: "Afk", avatar: "../assets/test-offline.png"}]

  	const Friends_Offline_Test = 
	[{login: "Test_Offline",avatar: "../assets/test-offline.png"}]

	const History_Game_Test = 
	[{result: "Victory", mode: "Ranked", opponent: "RaiNeko", avatar: "../assets/raineko.png", duration: "12 min", date: "Aujourd’hui 14:32"},
	{result: "Defeat", mode: "Normal", opponent: "Tsuki", avatar: "../assets/tsuki.png", duration: "18 min", date: "Aujourd’hui 12:14"},
	{result: "Victory", mode: "Challenge", opponent: "Daiko", avatar: "../assets/daiko.png", duration: "9 min", date: "Hier 22:01"},
	{result: "Victory",mode: "Ranked",opponent: "Mei",avatar: "../assets/mei.png",duration: "7 min",date: "Hier 18:45"},
	{result: "Defeat",mode: "Event",opponent: "Akemi",avatar: "../assets/akemi.png",duration: "15 min",date: "12/04/2025"}];

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

<div class="background">
  <img src="../assets/back-test.png" alt="Back">
</div>

<div class="top_bar">
	<div class="Logo_top_bar">
		<img class="Logo" src="../assets/onitama-grand.png" alt="Logo">
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
		{/if}
	</nav>
</div>

{#if onglet === "home"}
	<main class="home_page">
		<section class="home_hero">
			<!-- <img class="home_quote" src="../assets/paysage-principal.png" alt="L'art du déplacement, la maîtrise de soi"/> -->
			<button class="play_button" aria-label="Jouer">
			<img src="../assets/jouer.png" alt="Jouer"/>
			</button>
		</section>
		<section class="home_bottom">
			<section class="news_panel">
				<div class="news_title"> ACTUALITÉS </div>
				<img class="news_background" src="../assets/actualites-temple.png" alt=""/>
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
	</main>
{:else if onglet === "historique"}
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
{:else if onglet === "stats"}
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
{/if}

<aside class="friends_panel">
	<!-- <img class="profil_back" src="../assets/profil_back.png" alt=""/> -->
	<section class="profile_panel">
		<img class="profile_background" src="../assets/profile-panel-base.png" alt=""/>
		<div class="profile_content">
			<div class="profile_avatar_wrapper">
				<img class="profile_avatar" src="../assets/avatar-kenshii.png" alt="Kenshii"/>
				<span class="profile_level"> 42 </span>
			</div>
			<div class="profile_infos">
				<strong>Kenshii</strong>
				<span class="profile_status">
					<span class="status_dot online"></span>
					En ligne
				</span>
			</div>
		</div>
	</section>

	<section class="friends_content">
		<div class="friends_search">
			<input type="text" placeholder="Rechercher un ami..."/>
			<button class="search_button" aria-label="Rechercher">
				<Search size={21} />
			</button>
		</div>

		<div class="friends_group">
			<div class="friends_group_title">
				<span class="group_arrow"> ⌄ </span>
				<strong>
					AMIS ({Friends_Test.length}/12)
				</strong>
			</div>
			{#each Friends_Test as friend}
				<button class="friend_entry">
					<div class="friend_avatar_wrapper">
						<img class="friend_avatar" src={friend.avatar} alt={friend.login}/>
						<span
							class:online={friend.status === "Online"}
							class:ingame={friend.status === "InGame"}
							class:afk={friend.status === "Afk"}
							class="friend_status_dot"
						></span>
					</div>
					<div class="friend_infos">
						<strong> {friend.login}</strong>
						<span
							class:online_text={friend.status === "Online"}
							class:ingame_text={friend.status === "InGame"}
							class:afk_text={friend.status === "Afk"}>
							{#if friend.status === "Online"}
								En ligne
							{:else if friend.status === "InGame"}
								En jeu
							{:else}
								Absent
							{/if}
						</span>
					</div>
					<div class="friend_options" aria-label="Options"> ••• </div>
				</button>
			{/each}
		</div>
		<div class="friends_group offline_group">
			<div class="friends_group_title">
				<span class="group_arrow"> ⌄ </span>
				<strong> HORS LIGNE ({Friends_Offline_Test.length}) </strong>
			</div>
			{#each Friends_Offline_Test as friend}
				<button class="friend_entry offline_friend">
					<div class="friend_avatar_wrapper">
						<img class="friend_avatar" src={friend.avatar} alt={friend.login}/>
					</div>
					<div class="friend_infos">
						<strong> {friend.login} </strong>
						<span>Hors ligne</span>
					</div>
				</button>
			{/each}
		</div>
		<button class="friend_requests">
			<span> › </span>
			<strong> DEMANDES (1) </strong>
		</button>
	</section>
	<footer class="friends_footer">
		<img class="friends_footer_background" src="../assets/social-footer-base.png" alt="" />
		<div class="friends_footer_content">
			<button aria-label="Messages">
				<img src="../assets/message.png" alt="Messages"/>
			</button>
			<div class="friends_footer_separator"></div>
			<button aria-label="Ajouter un ami">
				<img src="../assets/add-friend.png" alt="Ajouter un ami"/>
			</button>
		</div>
	</footer>
</aside>
<!-- <div class="fixed inset-0 h-screen w-screen text-white overflow-hidden">
  <Resizable.PaneGroup direction="horizontal" class="h-full w-full">
    <Resizable.Pane defaultSize={80} class="flex items-center justify-center border-r border-zinc-800">
      <Resizable.PaneGroup direction="vertical">
        <Resizable.Pane defaultSize={15} class="flex items-center justify-center p-4">
                  <div class="flex justify-start items-start">
            <Avatar.Root class="h-50 w-50">
              <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
              <Avatar.Fallback>CN</Avatar.Fallback>
            </Avatar.Root>
            </div>
        <div class="flex justify-center items-center gap-2 w-full">
        <ButtonGroup.Root>
          <Button variant="secondary" size="sm" onclick={() => OngletChange("home")}>acceuile</Button>
          <ButtonGroup.Separator />
          <Button variant="secondary" size="sm" onclick={() => OngletChange("historique")}>historique</Button>
          <ButtonGroup.Separator />
          <Button variant="secondary" size="sm" onclick={() => OngletChange("stats")}>stats</Button>
          </ButtonGroup.Root>
          </div>
          <div class="flex justify-end items-start h-16 flex-1 p-2">
            <Button >
              <SettingsIcone />
            </Button>
            <Button >
              <Notification />
            </Button>
          </div>
        </Resizable.Pane>
      <Resizable.Handle disabled class="h-px bg-zinc-800 cursor-default pointer-events-none" />
        <Resizable.Pane defaultSize={85} class="relative flex flex-col justify-between h-full p-6">
         {#if onglet === "home"}
          <div class="w-full max-w-sm ml-0 mt-140">
            <Carousel.Root plugins={[plugin]} class="w-full">
              <Carousel.Content>
                {#each Array(5) as _, i (i)}
                  <Carousel.Item>
                    <div class="p-1">
                      <Card.Root>
                        <Card.Content class="flex aspect-square items-center justify-center p-6">
                          <span class="text-4xl font-semibold">{i + 1}</span>
                        </Card.Content>
                      </Card.Root>
                    </div>
                  </Carousel.Item>
                {/each}
              </Carousel.Content>
        <div class="flex justify-center gap-4 mt-4">
            <Carousel.Previous class="static translate-y-0" />
            <Carousel.Next class="static translate-y-0" />
          </div>
            </Carousel.Root>
          </div>
          <div class="absolute inset-x-0 bottom-8 flex justify-center mb-120 ml-390">
            <Button >
              Jouer
            </Button>
          </div>
        <div class="absolute inset-x-0 bottom-24 flex justify-center mb-50">
            <ButtonGroup.Root>
            <Button variant="secondary" size="sm">ranked</Button>
            <ButtonGroup.Separator />
            <Button variant="secondary" size="sm">clasique</Button>
            <ButtonGroup.Separator />
            <Button variant="secondary" size="sm">bot</Button>
            </ButtonGroup.Root>
          </div>
          {:else if onglet === "historique"}
          <div class="absolute left-8 flex flex-col items-start gap-20 bottom-24 mb-70">
              <Button variant="secondary" size="sm">
                clasique
              </Button>
              <Button variant="secondary" size="sm">
                ranked
              </Button>
              <Button variant="secondary" size="sm">
                toutes
              </Button>
              <Button variant="secondary" size="sm">
                jsp
              </Button>
            </div>
            <ScrollArea class="h-196 w-164 rounded-md border items-center mx-auto mt-40">
            <div class="p-4">
              <h4 class="mb-4 text-sm leading-none font-medium">Tags</h4>
              {#each tags as tag (tag)}
                <div class="text-sm">
                  {tag}
                </div>
                <Separator class="my-2" />
              {/each}
            </div>
          </ScrollArea>
          {:else}
          <h1>stats</h1>
          {/if}
          </Resizable.Pane>
              </Resizable.PaneGroup>
            </Resizable.Pane>
    <Resizable.Handle disabled class="w-px bg-zinc-800 cursor-default pointer-events-none" />
    <Resizable.Pane defaultSize={20}>
      <Resizable.PaneGroup direction="vertical">
        <Resizable.Pane defaultSize={15} class="flex items-center justify-center p-4">
          <div class="text-lg font-semibold">Two - Haut</div>
        </Resizable.Pane>
        <Resizable.Handle disabled class="h-px bg-zinc-800 cursor-default pointer-events-none" />
        <Resizable.Pane defaultSize={85} class="flex flex-col p-4 gap-4 justify-start items-center">
        <ButtonGroup.Root>
          <Input placeholder="Rechercher un ami..." />
          <Button variant="outline" size="icon" aria-label="Search">
            <Search />
          </Button>
        </ButtonGroup.Root>
        </Resizable.Pane>
      </Resizable.PaneGroup>
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div> -->

<style>

	:global(:root) {
		--friends-width: max(285px, 20vw);
		--topbar-height:
		clamp(115px, 14vh, 145px);
	}

	.background {
  		position: fixed;
  		inset: 0;
  		width: 100vw;
  		height: 100vh;
  		z-index: -1;
  		overflow: hidden;
	}

	.background img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.top_bar {
		position: fixed;
		top: 0;
		left: 0;
		width: calc(100vw - var(--friends-width));
		height: var(--topbar-height);
		z-index: 100;
		display: grid;
		grid-template-columns:
		clamp(250px, 22vw, 335px)
		minmax(0, 1fr);
		align-items: center;
		background: transparent;
	}

	.Logo_top_bar {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		overflow: visible;
	}

	.Logo {
		position: absolute;
		top: 0%;
		height: auto;
		object-fit: contain;
		user-select: none;
		pointer-events: none;
	}

	.navbar {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: clamp(25px, 3.7vw, 65px);
	}

	.accueil_button {
		padding: 0;
		margin: 0;
		border: none;
		outline: none;
		background: transparent;
		width: clamp(105px, 10vw, 155px);
		height: clamp(80px, 10vh, 105px);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		position: relative;
	}

	.accueil_button img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center;
		user-select: none;
		pointer-events: none;
	}

	.history_page {
		position: fixed;
		top: var(--topbar-height);
		left: 0;
		width:calc(100vw - var(--friends-width));
		height:calc(100vh - var(--topbar-height));
		z-index: 10;
		display: grid;
		grid-template-columns:clamp(165px,13.5vw,210px)
		minmax(0, 1fr);
		overflow: hidden;
		color: #1c1611;
	}

	.history_sidebar {
		position: relative;
		width: 100%;
		height: 100%;
		padding:clamp(25px, 3vh, 40px) 18px 25px 25px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.history_kanji {
		font-family:"Times New Roman", serif;
		font-size:clamp(75px, 7vw, 115px);
		font-weight: 700;
		line-height: 0.9;
		color: #15100d;
		margin-bottom:clamp(25px, 4vh, 42px);
		user-select: none;
	}

	.history_filters {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 8px;
	}

	.history_filters button {
		position: relative;
		min-height: 42px;
		padding:7px 15px;
		border: none;
		outline: none;
		background: transparent;
		color: #241a14;
		text-align: left;
		font-family: Georgia, serif;
		font-size:clamp(14px, 1.05vw, 17px);
		cursor: pointer;
		transition:transform 140ms ease, background 140ms ease, color 140ms ease;
	}

	.history_filters button:hover {
		transform:translateX(4px);
	}

	.history_filters button.active {
		color: #f1ddc1;
		background:linear-gradient(90deg, #701713, #9c211d, #681310);
		border-radius:55% 8% 50% 10% / 30% 45% 35% 50%;
		transform:rotate(-1deg);
	}

	.history_sidebar_quote {
		margin-top: auto;
		padding: 20px 10px;
		font-family: Georgia, serif;
		font-size:clamp(12px, 0.95vw, 15px);
		line-height: 1.45;
		color:#33251b;
	}

	.history_sidebar_quote p {
		margin: 0;
	}

	.history_stamp {
		width: 43px;
		height: 51px;
		margin:20px auto 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background:#a22520;
		border:3px solid #a22520;
		border-radius: 4px;
		color: #f3d4b1;
		font-size: 26px;
	}

	.history_content {
		min-width: 0;
		min-height: 0;
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-rows:auto minmax(0, 1fr)auto;
		padding:clamp(45px,7vh,75px)clamp(35px,4vw,65px)clamp(25px,4vh,45px) 0;
	}

	.history_header {
		margin-bottom:clamp(12px,2vh,20px);
	}

	.history_header h1 {
		margin: 0;
		font-family:Georgia, serif;
		font-size:clamp(25px,2.3vw,36px);
		font-weight: 700;
	}

	.history_header p {
		margin:8px 0 0;
		font-family:Georgia, serif;
		font-size:clamp(14px, 1.25vw, 20px);
	}

	.history_table {
		min-height: 0;
		width: 100%;
		display: grid;
		grid-template-rows:auto minmax(0, 1fr);
	}

	.history_table_header {
		height:clamp(40px,5vh,48px);
		display: grid;
		grid-template-columns:1.1fr 1fr 1.3fr 0.75fr 1.05fr 45px;
		align-items: center;
		padding: 0 18px;
		background:#181512;
		color:#eee2cf;
		font-family:Georgia, serif;
		font-size:clamp(12px,0.95vw,16px);
		border-radius: 50% 6px 40% 8px / 15% 10% 18% 10%;
		box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.025);
	}

	.history_rows {
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color:rgba(45, 34, 25, 0.35)transparent;
	}

	.history_row {
		min-height:clamp(48px,5.7vh,58px);
		display: grid;
		grid-template-columns: 1.1fr 1fr 1.3fr 0.75fr 1.05fr 45px;
		align-items: center;
		padding: 0 18px;
		border-bottom: 1px solid rgba(72, 52, 35, 0.25);
		background:rgba(244, 224, 195, 0.12);
		font-family: Georgia, serif;
		font-size:clamp(12px, 1vw, 16px);
		transition:background 130ms ease, transform 130ms ease;
	}

	.history_row:hover {
		background:rgba(245, 224, 194, 0.48);
		transform:translateX(2px);
	}

	.history_result {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.result_icon {
		width: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size:
		clamp(20px,1.7vw,28px);
	}

	.victory_text,
	.victory_icon {
		color:#16813e;
	}


	.defeat_text,
	.defeat_icon {
		color:#bd2a25;
	}

	.result_asset {
		width: 27px;
		height: 27px;
		object-fit: contain;
	}

	.history_mode {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.mode_icon {
		width: 25px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size:clamp(19px,1.5vw,25px);
		color: #17130f;
	}

	.history_opponent {
		min-width: 0;
		display: flex;
		align-items: center;
		gap:clamp(8px, 0.8vw, 12px);
	}

	.history_opponent img {
		width:clamp(34px, 2.8vw, 42px);
		height:clamp(34px,2.8vw,42px);
		flex-shrink: 0;
		border-radius: 50%;
		object-fit: cover;
	}

	.history_opponent span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.history_duration,
	.history_date {
		white-space: nowrap;
	}

	.history_options {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.history_options button {
		width: 35px;
		height: 35px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: #17130f;
		font-size: 18px;
		cursor: pointer;
		transition:transform 130ms ease;
	}


	.history_options button:hover {
		transform:scale(1.18);
	}

	.history_pagination {
		min-height:clamp(60px,8vh,85px);
		display: flex;
		align-items: center;
		justify-content: center;
		gap:clamp(8px,1vw,14px);
		padding-top: 10px;
	}

	.history_pagination button {
		min-width: 36px;
		height: 40px;
		padding:0 8px;
		border: none;
		background: transparent;
		color:#1f1711;
		font-family: Georgia, serif;
		font-size:clamp(14px,1.1vw,17px);
		cursor: pointer;
		border-radius: 4px;
		transition:background 130ms ease, color 130ms ease, transform 130ms ease;
	}

	.history_pagination button.active {
		background:#a8231e;
		color:#f6dfc1;
	}

	.history_pagination button:hover {
		transform:translateY(-2px);
	}

	.history_pagination .pagination_arrow {
		font-size: 30px;
	}

	.friends_panel {
		position: fixed;
		top: 0;
		right: 0;
		width: 20vw;
		min-width: 285px;
		height: 100vh;
		/* z-index: 0; */
		display: grid;
		grid-template-rows:clamp(145px, 15.5vh, 165px) minmax(0, 1fr);
		padding: 10px 5px 0px;
		/* background: transparent; */
		background: no-repeat url("../assets/profil_back.png");
		background-size: cover;
		/* background */
		object-fit: cover;
		overflow: hidden;
	}

	.profile_panel {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.profile_background {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: fill;
		pointer-events: none;
		z-index: 0;
	}

	.profile_content {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		gap:clamp(10px, 1vw, 16px);
		padding: 10px clamp(12px, 1.3vw, 20px);
	}

	.profile_avatar_wrapper {
		position: relative;
		width: clamp(70px, 6vw, 90px);
		height: clamp(70px, 6vw, 90px);
		/* flex-shrink: 0; */
	}

	.profile_avatar {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		/* border-radius: 20%; */
	}

	.profile_level {
		position: absolute;
		left: 50%;
		bottom: -7px;
		transform: translateX(-50%);
		min-width: 38px;
		padding:2px 8px;
		text-align: center;
		font-family:Georgia, serif;
		font-size: 15px;
		color: #eee0c6;
		background: #18130f;
		border: 2px solid #bca077;
		border-radius: 20px;
	}

	.profile_infos {
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-width: 0;
	}

	.profile_infos strong {
		font-family:Georgia, serif;
		font-size:clamp(17px, 1.5vw, 22px);
		color: #f2e4cc;
	}

	.profile_status {
		display: flex;
		align-items: center;
		gap: 7px;
		font-family:Georgia, serif;
		font-size: 14px;
		color: #87ba5e;
	}

	.status_dot,
	.friend_status_dot {
		display: block;
		border-radius: 50%;
	}

	.status_dot {
		width: 10px;
		height: 10px;
	}

	.status_dot.online,
	.friend_status_dot.online {
		background: #24b74e;
	}

	.friend_status_dot.ingame {
		background: #159ed4;
	}

	.friend_status_dot.afk {
		background: #d89528;
	}

	.friends_content {
		min-height: 0;
		display: flex;
		flex-direction: column;
		padding:7px 7px 0;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color:rgba(48, 37, 27, 0.4) transparent;
	}

	.friends_search {
		width: 100%;
		height: 40px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		border:1px solid rgba(49, 36, 26, 0.8);
		border-radius: 3px;
		background:rgba(248, 231, 203, 0.7);
		overflow: hidden;
	}

	.friends_search input {
		flex: 1;
		min-width: 0;
		height: 100%;
		padding:0 10px;
		border: none;
		outline: none;
		background: transparent;
		font-family: Georgia,serif;
		font-size:clamp(12px, 0.95vw, 15px);
		color: #4a3b2e;
	}

	.friends_search input::placeholder {
		color:rgba(73, 58, 45, 0.7);
	}

	.search_button {
		width: 38px;
		height: 38px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		background: transparent;
		color: #18130f;
		cursor: pointer;
	}

	.friends_group {
		margin-top: 10px;
		flex-shrink: 0;
	}

	.friends_group_title {
		height: 31px;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 2px;
		font-family: Georgia, serif;
		font-size:clamp(12px, 0.9vw, 15px);
		color: #231a14;
	}

	.group_arrow {
		width: 16px;
		font-size: 19px;
		line-height: 1;
	}

	.friend_entry {
		position: relative;
		width: 100%;
		min-height: 55px;
		display: grid;
		grid-template-columns:44px minmax(0, 1fr) 28px;
		align-items: center;
		gap: 9px;
		padding:4px 4px;
		border-radius: 5px;
		transition:background 150ms ease, transform 150ms ease;
		cursor: pointer;
	}

	.friend_entry:hover {
		background:rgba(50, 37, 25, 0.08);
		transform:translateX(2px);
	}

	.friend_avatar_wrapper {
		position: relative;
		width: 42px;
		height: 42px;
	}

	.friend_avatar {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	.friend_status_dot {
		position: absolute;
		right: -1px;
		bottom: 0;
		width: 11px;
		height: 11px;
		border:2px solid #e7cc9f;
	}

	.friend_infos {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.friend_infos strong {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: Georgia, serif;
		font-size:clamp(13px, 1vw, 16px);
		color: #211913;
	}

	.friend_infos span {
		font-family:Georgia, serif;
		font-size:clamp(11px, 0.82vw, 13px);
		color: #75604a;
	}

	.friend_options {
		width: 27px;
		height: 27px;
		padding: 0;
		border: none;
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #2b2119;
		font-size: 17px;
		cursor: pointer;
		opacity: 0.8;
		transition:opacity 130ms ease,transform 130ms ease;
	}

	.friend_options:hover {
		opacity: 1;
		transform: scale(1.15);
	}

	.offline_group {
		margin-top: 4px;
	}

	.offline_friend {
		grid-template-columns:44px minmax(0, 1fr);
		opacity: 0.48;
	}

	.offline_friend:hover {
		opacity: 0.65;
	}

	.friend_requests {
		width: 100%;
		min-height: 42px;
		display: flex;
		align-items: center;
		gap: 7px;
		padding:5px 4px;
		border: none;
		background: transparent;
		color: #241b14;
		font-family:Georgia,serif;
		font-size:clamp(12px, 0.9vw, 15px);
		text-align: left;
		cursor: pointer;
	}

	.friend_requests > span {
		font-size: 25px;
	}

	.friends_footer {
		position: relative;
		width: 100%;
		height: 100%;
		align-self: end;
		overflow: hidden;
	}

	.friends_footer_background {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: fill;
		pointer-events: none;
		z-index: 0;
	}

	.friends_footer_content {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.friends_footer_content button {
		width: 62px;
		height: 55px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		transition:transform 150ms ease;
	}

	.friends_footer_content button:hover {
		transform: scale(1.12);
	}

	.friends_footer_content button img {
		width: 27px;
		height: 27px;
		object-fit: contain;
	}

	.friends_footer_separator {
		width: 1px;
		height: 36px;
		background:rgba(239, 222, 194, 0.24);
	}


	.home_page {
		position: fixed;
		left: 0;
		top: clamp(115px, 14vh, 145px);
		width:calc(100vw - var(--friends-width));
		height:calc(100vh - clamp(115px, 14vh, 145px));
		z-index: 10;
		display: grid;
		grid-template-rows:minmax(330px, 52%) minmax(0, 48%);
		overflow: hidden;
	}

	.home_hero {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: url("../assets/paysage-principal.png");
		/* background-size: contain; */
		background-size: 100% 101%;
	}

	.home_quote {
		position: absolute;
		left:clamp(0px, 0vw, 0px);
		top:clamp(0px,0px,0px);
		width:clamp(1800px,1400px,900px);
		height: auto;
		object-fit: contain;
		pointer-events: none;
		user-select: none;
	}

	.play_button {
		position: absolute;
		left: 69%;
		top: 80%;
		transform:translate(-50%, -50%);
		width:clamp(340px,34vw,535px);
		padding: 0;
		margin: 0;
		border: none;
		outline: none;
		background: transparent;
		cursor: pointer;
		transition:transform 160ms ease, filter 160ms ease;
	}

	.play_button img {
		display: block;
		width: 100%;
		height: auto;
		object-fit: contain;
		pointer-events: none;
		user-select: none;
	}

	.play_button:hover {
		transform:translate(-50%, -50%) scale(1.035);
		filter:drop-shadow(0 7px 7px rgba(0, 0, 0, 0.2));
	}

	.play_button:active {
		transform:translate(-50%, -50%) scale(0.975);
	}

	.home_bottom {
		min-height: 0;
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns:minmax(300px, 37%) minmax(0, 1fr);
		gap:clamp(10px, 9vw, 20px);
		padding:8px 14px 12px 25px;
		background: no-repeat url("../assets/bottom_home.png");
		background-size: cover;
	}

	.news_panel {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: hidden;
		border:3px solid rgba(25, 19, 14,0.88);
		background: #16120f;
		box-shadow:0 4px 10px rgba(0, 0, 0, 0.2);
	}

	.news_background {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		z-index: 0;
		user-select: none;
		pointer-events: none;
	}

	.news_gradient {
		position: absolute;
		inset: 0;
		z-index: 1;
		background:linear-gradient( to bottom, transparent 30%,rgba(12, 10, 8, 0.15) 50%,rgba(12, 10, 8, 0.9) 100%);
		pointer-events: none;
	}

	.news_title {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 3;
		padding:8px 25px;
		background:#17130f;
		color:#eee0c7;
		font-family:Georgia, serif;
		font-size:clamp(13px, 1vw, 17px);
		font-weight: 600;
		clip-path:polygon(0 0, 100% 0, 90% 100%, 0 100%);
	}

	.news_content {
		position: absolute;
		left:clamp(14px,1.3vw,22px);
		right:clamp(14px,1.3vw,22px);
		bottom:clamp(10px,1.2vh,18px);
		z-index: 3;
		color:#f0e2ca;
	}

	.news_content h2 {
		margin:0 0 6px;
		font-family:Georgia, serif;
		font-size:clamp(18px, 1.6vw, 27px);
	}

	.news_content p {
		margin: 0;
		font-family: Georgia, serif;
		font-size:clamp(11px, 0.95vw, 15px);
		line-height: 1.4;
	}

	.news_navigation {
		margin-top:clamp(8px, 1.2vh, 14px);
		display: grid;
		grid-template-columns:40px 1fr 40px;
		align-items: center;
	}

	.news_arrow {
		width: 38px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		background: transparent;
		color:#f3e4cb;
		font-family:Georgia, serif;
		font-size: 34px;
		cursor: pointer;
		transition:transform 120ms ease, opacity 120ms ease;
	}

	.news_arrow:hover {
		transform:scale(1.18);
		opacity: 0.8;
	}

	.news_dots {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.news_dot {
		width: 9px;
		height: 9px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background:rgba(240, 226, 202, 0.3);
		cursor: pointer;
	}

	.news_dot.active {
		background:#eee0c7;
	}

	.game_modes {
		min-width: 0;
		min-height: 0;
		display: grid;
		grid-template-columns:repeat(3, minmax(0, 1fr));
		grid-template-rows:minmax(0, 1fr) auto;
		gap:clamp(6px, 0.7vw, 10px);
	}

	.game_mode_card {
		min-width: 0;
		min-height: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		border: none;
		outline: none;
		background: transparent;
		cursor: pointer;
		overflow: hidden;
		transition:transform 160ms ease,filter 160ms ease;
	}

	.game_mode_card img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position:top;
		pointer-events: none;
		user-select: none;
	}

	.game_mode_card:hover {
		transform:translateY(-5px) scale(1.012);
		filter:drop-shadow(0 6px 5px rgba(0, 0, 0, 0.15));
	}

	.game_mode_card:active {
		transform:translateY(-1px) scale(0.985);
	}

	.home_bottom_quote {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		padding: 4px 5px;
		color: #1d1611;
		text-align: center;
	}

	.home_bottom_quote p {
		margin: 0;
		font-family: cursive;
		font-style: italic;
		font-size:clamp(16px,1.55vw, 26px);
	}

	.home_bottom_quote span {
		font-family: Georgia, serif;
		font-size:clamp(10px, 0.85vw, 14px);
	}

	.stats_page {
		position: fixed;
		top: var(--topbar-height);
		left: 0;
		width: calc(100vw - var(--friends-width));
		height: calc(100vh - var(--topbar-height));
		z-index: 10;
		display: grid;
		grid-template-columns: clamp(185px, 15vw, 225px) minmax(0, 1fr);
		overflow: hidden;
		color: #1b1510;
	}

	.stats_sidebar {
		position: relative;
		height: 100%;
		padding: clamp(25px, 3vh, 40px) 18px 25px 28px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.stats_kanji {
		font-family: "Times New Roman", serif;
		font-size: clamp(80px, 7vw, 115px);
		font-weight: 700;
		line-height: 0.9;
		margin-bottom: 25px;
		color: #120e0b;
	}

	.stats_side_quote {
		font-family: Georgia, serif;
		font-size: clamp(13px, 1vw, 17px);
		line-height: 1.45;
		margin-bottom: 16px;
	}

	.stats_stamp,
	.stats_quote_stamp {
		width: 47px;
		height: 55px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #a41e1b;
		color: #f1d4b2;
		font-size: 27px;
		border-radius: 4px;
		border: 2px solid #b3322d;
	}

	.stats_stamp {
		margin: 0 auto 25px;
	}

	.stats_filters {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.stats_filters button {
		position: relative;
		min-height: 42px;
		padding: 7px 12px;
		border: none;
		background: transparent;
		text-align: left;
		font-family: Georgia, serif;
		font-size: clamp(13px, 1vw, 16px);
		color: #211812;
		cursor: pointer;
		transition: transform 140ms ease;
	}

	.stats_filters button:hover {
		transform: translateX(4px);
	}

	.stats_filters button.active {
		color: #f3dbc0;
		background: linear-gradient(90deg, #711310, #a4231e, #69110e);
		border-radius: 50% 9% 45% 12% / 35% 50% 30% 45%;
	}

	.stats_content {
		min-width: 0;
		min-height: 0;
		height: 100%;
		display: grid;
		grid-template-rows: auto auto minmax(220px, 1fr) minmax(270px, 1.35fr);
		gap: clamp(10px, 1.2vh, 16px);
		padding: clamp(45px, 6vh, 65px) clamp(25px, 2.5vw, 38px) 35px 0;
	}

	.stats_header h1 {
		margin: 0;
		font-family: Georgia, serif;
		font-size: clamp(27px, 2.3vw, 36px);
	}

	.stats_header p {
		margin: 7px 0 0;
		font-family: Georgia, serif;
		font-size: clamp(14px, 1.2vw, 20px);
	}

	.stats_summary {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}

	.summary_card,
	.stats_box,
	.stats_quote_bottom {
		border: 1px solid rgba(82, 59, 39, 0.35);
		border-radius: 5px;
		background: rgba(243, 224, 194, 0.28);
	}

	.summary_card {
		min-height: clamp(95px, 12vh, 120px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		font-family: Georgia, serif;
	}

	.summary_main {
		display: flex;
		align-items: center;
		gap: 18px;
		font-size: clamp(25px, 2vw, 32px);
	}

	.summary_main strong {
		font-size: clamp(24px, 2vw, 32px);
	}

	.summary_main.red {
		color: #b31818;
	}

	.summary_icon {
		font-size: clamp(32px, 3vw, 45px);
		line-height: 1;
	}

	.summary_card > span {
		font-size: clamp(14px, 1.15vw, 18px);
	}

	.stats_middle {
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(320px, 0.78fr) minmax(430px, 1.05fr);
		gap: 10px;
	}

	.stats_box {
		min-width: 0;
		min-height: 0;
		padding: 14px 20px;
		overflow: hidden;
	}

	.stats_box h2 {
		margin: 0 0 14px;
		font-family: Georgia, serif;
		font-size: clamp(15px, 1.25vw, 20px);
	}

	.mode_distribution {
		height: calc(100% - 35px);
		display: grid;
		grid-template-columns: minmax(135px, 1fr) minmax(150px, 0.9fr);
		align-items: center;
		gap: 15px;
	}

	.donut {
		width: clamp(125px, 12vw, 160px);
		aspect-ratio: 1;
		justify-self: center;
		border-radius: 50%;
		background:conic-gradient(#8d0909 0% 42%, #343434 42% 70%, #777777 70% 88%, #171717 88% 100%);
		position: relative;
	}

	.donut::after {
		content: "";
		position: absolute;
		inset: 28%;
		border-radius: 50%;
		background: #ead6b8;
	}

	.mode_legend {
		display: flex;
		flex-direction: column;
		gap: 14px;
		font-family: Georgia, serif;
	}

	.legend_line {
		display: grid;
		grid-template-columns: 13px 1fr auto;
		align-items: center;
		gap: 10px;
		font-size: clamp(12px, 0.95vw, 15px);
	}

	.legend_dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.rank_box {
		display: flex;
		flex-direction: column;
	}

	.rank_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.rank_header h2 {
		margin-bottom: 0;
	}

	.rank_header select {
		padding: 6px 35px 6px 12px;
		background: rgba(245, 227, 199, 0.5);
		border: 1px solid rgba(67, 48, 33, 0.4);
		border-radius: 5px;
		font-family: Georgia, serif;
	}

	.rank_chart {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: 65px minmax(0, 1fr);
		margin-top: 15px;
	}

	.rank_labels {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 10px 5px 26px 0;
		font-family: Georgia, serif;
		font-size: clamp(10px, 0.8vw, 13px);
	}

	.rank_graph {
		position: relative;
		min-height: 0;
	}

	.rank_graph svg {
		position: absolute;
		inset: 0 0 25px 0;
		width: 100%;
		height: calc(100% - 25px);
		overflow: visible;
	}

	.rank_grid_line {
		stroke: rgba(70, 53, 38, 0.15);
		stroke-width: 0.4;
	}

	.rank_line {
		fill: none;
		stroke: #aa1715;
		stroke-width: 1.5;
		vector-effect: non-scaling-stroke;
	}

	.rank_point {
		fill: #bf1b18;
	}

	.rank_months {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		font-family: Georgia, serif;
		font-size: clamp(9px, 0.75vw, 12px);
		text-align: center;
	}

	.stats_bottom {
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(260px, 1fr) minmax(245px, 0.92fr) minmax(300px, 1.05fr);
		gap: 10px;
	}

	.ranking_box {
		display: flex;
		flex-direction: column;
	}

	.ranking_row {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: 22px 72px minmax(0, 1fr) auto;
		align-items: center;
		gap: 8px;
		border-top: 1px solid rgba(80, 58, 39, 0.12);
		font-family: Georgia, serif;
		font-size: clamp(10px, 0.85vw, 14px);
	}

	.ranking_position {
		text-align: center;
	}

	.ranking_card_image {
		width: 70px;
		height: 39px;
		object-fit: cover;
	}

	.opponent_row {
		grid-template-columns: 22px 43px minmax(0, 1fr) auto;
	}

	.opponent_avatar {
		width: 39px;
		height: 39px;
		object-fit: cover;
		border-radius: 50%;
	}

	.ranking_name,
	.ranking_games {
		white-space: nowrap;
	}

	.stats_right_bottom {
		min-height: 0;
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
		gap: 10px;
	}

	.hourly_box {
		display: flex;
		flex-direction: column;
	}

	.bar_chart {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: 38px minmax(0, 1fr);
	}

	.bar_scale {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding-bottom: 22px;
		font-family: Georgia, serif;
		font-size: 10px;
	}

	.bars {
		min-height: 0;
		display: grid;
		grid-template-columns: repeat(11, 1fr);
		align-items: end;
		gap: 3px;
		border-bottom: 1px solid rgba(60, 45, 32, 0.35);
		background:repeating-linear-gradient(to top, transparent 0, transparent 24%, rgba(65, 47, 33, 0.08) 25%);
	}

	.bar_column {
		height: 100%;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
	}

	.bar {
		width: 75%;
		min-height: 3px;
		background: #1c1a17;
	}

	.bar.red_bar {
		background: #b71916;
	}

	.bar_column span {
		height: 20px;
		display: flex;
		align-items: flex-end;
		font-family: Georgia, serif;
		font-size: 9px;
	}

	.stats_quote_bottom {
		position: relative;
		min-height: 90px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 10px 55px 10px 15px;
	}

	.stats_quote_bottom p {
		margin: 0;
		font-family: cursive;
		font-style: italic;
		font-size: clamp(16px, 1.5vw, 24px);
		text-align: center;
	}

	.stats_quote_bottom > span {
		margin-top: 7px;
		font-family: Georgia, serif;
		font-size: 13px;
	}

	.stats_quote_stamp {
		position: absolute;
		right: 15px;
		bottom: 10px;
		width: 38px;
		height: 44px;
		font-size: 22px;
	}

	@media (max-width: 1250px) {
		.stats_page {grid-template-columns: 175px minmax(0, 1fr);}
		.stats_content {padding-right: 20px;}
		.stats_middle {grid-template-columns: 0.8fr 1fr;}
		.stats_bottom {grid-template-columns: 1fr 1fr;}
		.stats_right_bottom {grid-column: 1 / -1;grid-template-columns: 1fr 0.7fr;grid-template-rows: 1fr;}
		.ranking_card_image {width: 55px;}
		.home_page {grid-template-rows: minmax(300px, 50%) minmax(0, 50%);}
		.home_quote {width:clamp(160px, 17vw, 210px);}
		.play_button {left: 67%; width: clamp(300px, 32vw, 400px);}
		.home_bottom {grid-template-columns: minmax(280px, 38%) minmax(0, 1fr); padding-left: 15px;}
		.game_modes {gap: 5px;}
	}

</style>