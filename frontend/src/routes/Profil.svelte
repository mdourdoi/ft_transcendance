<script lang="ts">
	export let onCustomize: (section: 'avatar' | 'frame' | 'title' | 'name' | 'all') => void = () => {};
 	export let player = {name: 'Kenshii', title: 'Disciple du vent', quote: 'Le calme est ma force.', level: 42, xp: 6500, xpTarget: 10000, avatar: '/assets/profile/avatar-kenshii.png'};
	let profileSection: 'overview' | 'achievements' | 'customization' = 'overview';

  	type Achievement = {
    	title: string;
    	description: string;
    	image: string;
    	unlocked?: boolean;
    	progress?: number;
  	};

  	const achievements: Achievement[] = [
    { title: 'Premier pas', description: 'Remporter une partie.', image: '/assets/profile/achievement-lotus.png', unlocked: true },
    { title: 'Esprit du tigre', description: 'Gagner 10 parties.', image: '/assets/profile/achievement-tiger.png', unlocked: true },
    { title: 'Voie du temple', description: 'Gagner par le temple.', image: '/assets/profile/achievement-torii.png', unlocked: true },
    { title: 'Série parfaite', description: '4 / 5 victoires consécutives.', image: '/assets/profile/achievement-blades.png', progress: 80 },
    { title: 'Cent victoires', description: '73 / 100 victoires.', image: '/assets/profile/achievement-crane.png', progress: 73 },
    { title: 'Maître du dojo', description: 'Atteindre le niveau 50.', image: '/assets/profile/achievement-dragon.png', progress: 0 }
  	];

    $: levelProgress = player.xpTarget > 0 ? Math.max(0, Math.min(100, Math.round((player.xp / player.xpTarget) * 100))) : 0;

</script>

<main class="Profil_page">
	<aside class="Profil_sidebar">
		<div class="Profil_kanji"> 統 </div>
		<nav class="Profil_filters" aria-label="Rubriques du profil">
            <button type="button" class:active={profileSection === 'overview'} aria-pressed={profileSection === 'overview'} onclick={() => profileSection = 'overview'}>Vue d’ensemble</button>
            <button type="button" class:active={profileSection === 'achievements'} aria-pressed={profileSection === 'achievements'} onclick={() => profileSection = 'achievements'}>Succès</button>
            <button type="button" class:active={profileSection === 'customization'} aria-pressed={profileSection === 'customization'} onclick={() => profileSection = 'customization'}>Personnalisation</button>
        </nav>
        <div class="Profil_sidebar_quote">
            <p>« La maîtrise<br />de soi mène<br />à la victoire. »</p>
            <div class="Profil_stamp" aria-hidden="true">棋</div>
        </div>
	</aside>
	<section class="Profil_content">
		<header class="Profil_header">
			<h1><strong>Mon Profil</strong></h1>
			<p>Montre ton style et ta patience</p>
		</header>
		<section class="identity-card parchment-card" aria-label="Identité et niveau">
			<div class="avatar-block">
			<div class="avatar-ring">
				<img src={player.avatar} alt={`Avatar de ${player.name}`} />
				<button type="button" aria-label="Changer la photo" onclick={() => onCustomize('avatar')}>◉</button>
			</div>
			<button class="outline-button" type="button" onclick={() => onCustomize('avatar')}>Changer l’avatar</button>
			</div>
			<div class="identity-copy">
			<h2>{player.name} <button type="button" aria-label="Modifier le nom" onclick={() => onCustomize('name')}>✎</button></h2>
			<strong>{player.title} <button type="button" aria-label="Modifier le titre" onclick={() => onCustomize('title')}>✎</button></strong>
			<span class="brush-line"></span>
			<q>{player.quote}</q>
			</div>
			<div class="level-block">
			<div class="enso-level"><span>{player.level}</span></div>
			<div class="level-copy">
				<strong>NIVEAU</strong>
				<div class="progress" role="progressbar" aria-label="Progression du niveau" aria-valuenow={levelProgress} aria-valuemin={0} aria-valuemax={100}><span style={`width: ${levelProgress}%`}></span></div>
				<b>{levelProgress}%</b>
				<p>{player.xp.toLocaleString('fr-FR')} / {player.xpTarget.toLocaleString('fr-FR')} XP</p>
				<small>Niveau suivant : {player.level + 1}</small>
			</div>
			</div>
		</section>

		<section class="panel parchment-card" class:hidden={profileSection === 'customization'}>
			<header class="section-heading">
			<h2><span>◒</span> Succès de partie</h2>
			<div><b>{achievements.filter((achievement) => achievement.unlocked).length} / {achievements.length} débloqués</b><button type="button" onclick={() => profileSection = 'achievements'}>Voir tous　›</button></div>
			</header>
			<div class="achievement-grid">
			{#each achievements as achievement}
				<article class:locked={!achievement.unlocked && achievement.progress === 0}>
				<img src={achievement.image} alt="" />
				<div>
					<h3>{achievement.title}</h3>
					<p>{achievement.description}</p>
					{#if achievement.progress !== undefined}
					<div class="mini-progress">
						<span><i style={`width: ${achievement.progress}%`}></i></span>
						<b>{achievement.progress}%</b>
					</div>
					{/if}
				</div>
				{#if achievement.unlocked}<span class="achievement-seal">達</span>{:else if achievement.progress === 0}<span class="lock">♟</span>{/if}
				</article>
			{/each}
			</div>
		</section>
		<section class="customization parchment-card" class:hidden={profileSection === 'achievements'}>
			<header class="section-heading"><h2><span>◒</span> Personnalisation</h2></header>
			<div class="customization-content">
			<button class="choice" type="button" onclick={() => onCustomize('avatar')}>
				<img src={player.avatar} alt="" />
				<span><b>Avatar</b><small>Modifiez votre avatar de profil.</small></span>
			</button>
			<button class="choice" type="button" onclick={() => onCustomize('frame')}>
				<span class="frame-preview"></span>
				<span><b>Cadre</b><small>Choisissez un cadre pour votre avatar.</small></span>
			</button>
			<button class="choice" type="button" onclick={() => onCustomize('title')}>
				<span class="title-preview">Disciple du vent</span>
				<span><b>Titre</b><small>Affichez votre titre favori.</small></span>
			</button>
			<div class="customize-cta">
				<button class="ink-button" type="button" onclick={() => onCustomize('all')}>Personnaliser</button>
				<q>L’apparence suit l’esprit.</q>
				<span>— 御 寺 間 —　<em>棋</em></span>
			</div>
			</div>
		</section>
	</section>
</main>

<style>
    .Profil_page {
		/* Position */
		position: fixed;
        inset: var(--topbar-height, 80px) var(--friends-width, 0px) 0 0;
        z-index: 10;

		/* Lenght */
		grid-template-columns: clamp(165px, 13.5vw, 210px) minmax(0, 1fr);

		/* Display */
		display: grid;
		color: #1c1611;
		overflow: hidden;
        --ink: #181512;
        --red: #a22520;
        --line: rgba(72, 52, 35, .25);

		/* Container */
		container: profile-page / inline-size;

		/* Text */
        font-family: Georgia, serif;
    }

    .Profil_page, .Profil_page * { 
		/* Border */
		box-sizing: border-box;
	}

    button {
		/* Display */
		color: inherit;

		/* Text */
		font: inherit;

		/* Cursor */
		cursor: pointer;
	}

    button:focus-visible {
		/* Display */
		outline: 2px solid var(--red);
		outline-offset: 3px;
	}

    .Profil_sidebar {
		/* Lenght */
        min-width: 0;
        min-height: 0;

		/* Alignement */
        padding: clamp(25px, 3vh, 40px) 18px 25px 25px;

		/* Display */
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .Profil_kanji {
		/* Alignement */
        margin-bottom: clamp(25px, 4vh, 42px);

		/* Display */
        color: #15100d;

		/* Cursor */
		user-select: none;

		/* Text */
        font: 700 clamp(75px, 7vw, 115px)/.9 "Times New Roman", serif;
    }
    .Profil_filters {
		/* Alignement */
		gap: 8px; 

		/* Display */
		display: flex;
		flex-direction: column;
	}

    .Profil_filters button {
		/* Lenght */
        min-height: 42px;

		/* Alignement */
        padding: 7px 12px;

		/* Animation */
		transition: transform 140ms ease, background 140ms ease, color 140ms ease;

		/* Background */
		background: transparent;

		/* Border */
        border: 0;

		/* Text */
        text-align: left;
        overflow-wrap: anywhere;
        font-size: clamp(13px, 1.05vw, 17px);
    }

    .Profil_filters button:hover {
		/* Animation */
		transform: translateX(3px);
	}

    .Profil_filters button.active {
		/* Display */
        color: #f1ddc1;

		/* Background */
        background: linear-gradient(90deg, #701713, #9c211d, #681310);

		/* Border */
        border-radius: 55% 8% 50% 10% / 30% 45% 35% 50%;
    }

    .Profil_sidebar_quote {
		/* Alignement */
		margin-top: auto;
		padding: 20px 10px 0;
		
		/* Display */
		color: #33251b;
		
		/* Text */
		font-size: clamp(12px, .95vw, 15px);
		line-height: 1.45;
	}

    .Profil_sidebar_quote p {
		/* Alignement */
		margin: 0;
	}
    .Profil_stamp {
		/* Lenght */
		width: 43px;
		height: 51px;

		/* Alignement */
		margin: 20px auto 0;
		place-items: center;

		/* Display */
		display: grid;
		color: #f3d4b1;

		/* Background */
		background: var(--red);

		/* Border */
		border-radius: 4px;

		/* Text */
		font-size: 26px;
	}

    .Profil_content {
		/* Lenght */
        min-width: 0;
        min-height: 0;
		grid-template-columns: minmax(0, 1fr);
        grid-auto-rows: max-content;

		/* Alignement */
		align-content: start;
        gap: clamp(10px, 1.5vh, 16px);
        padding: clamp(24px, 4vh, 48px) clamp(18px, 3vw, 50px) 22px 0;

		/* Display */
        display: grid;
        overflow-y: auto;

		/* Container */
		container: profile-content / inline-size;

		/* Scrollbar */
        scrollbar-width: thin;
        scrollbar-color: rgba(45, 34, 25, .35) transparent;
    }

    .Profil_header h1 {
		/* Alignement */
		margin: 0;

		/* Text */
		font-size: clamp(25px, 2.3vw, 36px);
	}

    .Profil_header p {
		/* Alignement */
		margin: 8px 0 0;

		/* Text */
		font-size: clamp(14px, 1.25vw, 20px);
	}

    .parchment-card {
		/* Lenght */
		min-width: 0;

		/* Background */
		background: rgba(244, 224, 195, .18);

		/* Border */
		border: 1px solid var(--line);
		border-radius: 5px;
	}

    .identity-card {
		/* Lenght */
		grid-template-columns: minmax(100px, .65fr) minmax(0, 1.3fr) minmax(0, 1.2fr);

		/* Alignement */
		align-items: center;
        gap: clamp(10px, 1.4vw, 22px);
        padding: 12px 16px;

		/* Display */
        display: grid;
    }

    .avatar-block {
		/* Lenght */
		min-width: 0;

		/* Alignement */
		gap: 8px;

		/* Display */
		display: grid;
		justify-items: center;
	}

    .avatar-ring {
		/* Position */
		position: relative;
		
		/* Lenght */
		width: clamp(76px, 9vh, 116px);
		
		/* Display */
		aspect-ratio: 1;
		overflow: hidden; 

		/* Background */
		background: #cf4f47;
		
		/* Border */
		border: 4px solid var(--ink);
		border-radius: 50%;
		box-shadow: 0 0 0 2px #e9d4af;
	}

    .avatar-ring img {
		/* Lenght */
		width: 100%;
		height: 100%;
		
		/* Object */
		object-fit: cover;
	}

    .avatar-ring button {
		/* Position */
		position: absolute;
		bottom: 0;
		right: 0;
		
		/* Lenght */
		width: 28px;
		height: 28px;

		/* Display */
		color: #eee2cf;

		/* Background */
		background: var(--ink);
		
		/* Border */
		border: 0;
		border-radius: 50%;
	}

    .outline-button {
		/* Lenght */
		max-width: 100%;

		/* Alignement */
		padding: 5px 8px;

		/* Background */
		background: transparent;

		/* Border */
		border: 1px solid var(--line);
		border-radius: 4px;

		/* Text */
		font-size: 12px;
	}

    .identity-copy {
		/* Lenght */
		min-width: 0;
		
		/* Display */
		overflow-wrap: anywhere;
	}

    .identity-copy h2 {
		/* Alignement */
		margin: 0 0 7px;
		
		/* Text */
		font-size: clamp(21px, 2vw, 30px);
	}

    .identity-copy button {
		/* Background */
		background: transparent;

		/* Border */
		border: 0;
	}

    .identity-copy strong {
		/* Text */
		font-size: 14px;
	}

    .identity-copy q {
		/* Text */
		font-size: 14px;
		font-style: italic;
	}

    .brush-line {
		/* Lenght */
		width: min(100%, 220px);
		height: 5px;

		/* Alignement */
		margin: 12px 0 8px;

		/* Display */
		display: block;

		/* Background */
		background: var(--ink);

		/* Object */
		clip-path: polygon(0 42%, 100% 0, 91% 64%, 5% 100%);
	}

    .level-block {
		/* Lenght */
		min-width: 0;

		/* Alignement */
		align-items: center;
		gap: 14px;

		/* Display */
		display: flex;
	}

    .enso-level {
		/* Alignement */
		flex: 0 0 clamp(65px, 7vw, 95px);
		place-items: center;

		/* Display */
		display: grid;
		aspect-ratio: 1;
		/* Animation */
		transform: rotate(-7deg);

		/* Border */
		border: 8px solid var(--ink);
		border-radius: 48% 52% 46% 54%;
	}

    .enso-level span {
		/* Animation */
		transform: rotate(7deg);

		/* Text */
		font-size: clamp(28px, 2.8vw, 40px);
	}
    .level-copy {
		/* Lenght */
		min-width: 0;
		grid-template-columns: minmax(0, 1fr) auto;

		/* Alignement */
		align-items: center;
		gap: 6px;

		/* Display */
		display: grid;
		flex: 1;
		overflow-wrap: anywhere;

		/* Text */
		font-size: 12px;
	}

    .level-copy > strong, .level-copy p, .level-copy small {
		/* Alignement */
		grid-column: 1 / -1;
		margin: 0;
	}

    .progress, .mini-progress > span {
		/* Lenght */
		min-width: 0;
		height: 10px;

		/* Display */
		overflow: hidden;

		/* Background */
		background: rgba(80, 60, 40, .15);
		
		/* Border */
		border: 1px solid var(--line);
		border-radius: 3px;
	}

    .progress span, .mini-progress i {
		/* Lenght */
		height: 100%; 

		/* Display */
		display: block;
		
		/* Background */
		background: linear-gradient(90deg, #701713, #a22520);
	}

    .panel, .customization {
		/* Alignement */
		padding: 0 10px 10px;
	}

    .hidden {
		/* Display */
		display: none;
	}

    .section-heading {
		/* Lenght */
		min-height: 38px;

		/* Display */
		display: flex;
		color: #eee2cf;
		justify-content: space-between;
		
		/* Alignement */
		align-items: center;
		flex-wrap: wrap;
		gap: 8px 14px;
		padding: 8px 12px;
		margin: 0 -10px 10px;

		/* Background */
		background: var(--ink);

		/* Border */
		border-radius: 50% 6px 40% 8px / 15% 10% 18% 10%;
	}

    .section-heading h2 {
		/* Alignement */
		margin: 0;
		
		/* Text */
		font-size: clamp(15px, 1.2vw, 19px);
	}

    .section-heading h2 span {
		/* Alignement */
		margin-right: 6px;
	}

    .section-heading > div {
		/* Alignement */
		align-items: center;
		flex-wrap: wrap;
		gap: 8px 14px;

		/* Display */
		display: flex;
		
		/* Text */
		font-size: 12px;
	}

    .section-heading button {
		/* Alignement */
		padding: 0;

		/* Background */
		background: transparent;
		
		/* Border */
		border: 0;
		
		/* Text */
		text-decoration: underline;
	}

    .achievement-grid {
		/* Lenght */
		grid-template-columns: repeat(3, minmax(0, 1fr));

		/* Alignement */
		gap: 6px;

		/* Display */
		display: grid;
	}

    .achievement-grid article {
		/* Lenght */
		min-width: 0;
		grid-template-columns: 48px minmax(0, 1fr) 20px;

		/* Alignement */
		align-items: center;
		gap: 7px;
		padding: 8px 6px;
		
		/* Display */
		display: grid;

		/* Background */
		background: rgba(244, 224, 195, .12);
		
		/* Border */
		border-bottom: 1px solid var(--line);
	}

    .achievement-grid article:hover {
		/* Background */
		background: rgba(245, 224, 194, .48);
	}

    .achievement-grid article > img {
		/* Lenght */
		width: 48px;
		height: 48px;
		
		/* Object */
		object-fit: contain;
	}

    .achievement-grid h3 {
		/* Alignement */
		margin: 0 0 5px;

		/* Display */
		overflow-wrap: anywhere; 
		
		/* Text */
		font-size: 13px;
	}

    .achievement-grid p {
		/* Alignement */
		margin: 0;

		/* Display */
		overflow-wrap: anywhere;

		/* Text */
		font-size: 12px;
		line-height: 1.3;
	}

    .achievement-seal {
		/* Lenght */
		width: 20px;
		height: 27px;

		/* Display */
		display: grid;
		color: #f3d4b1;
		place-items: center;

		/* Background */
		background: var(--red); 
		
		/* Border */
		border-radius: 2px;
	}

    .locked {
		/* Display */
		filter: grayscale(.8);
		opacity: .82;
	}

    .lock {
		/* Text */
		font-size: 20px;
	}

    .mini-progress {
		/* Alignement */
		align-items: center;
		gap: 5px;
		margin-top: 6px; 

		/* Display */
		display: flex;
	}

    .mini-progress > span {
		/* Lenght */
		height: 7px;

		/* Display */
		flex: 1;
	}

    .mini-progress b {
		/* Text */
		font-size: 10px;
	}

    .customization-content {
		/* Lenght */
		grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.1fr);

		/* Alignement */
		gap: 8px;

		/* Display */
		display: grid;
	}

    .choice {
		/* Lenght */
		min-width: 0;

		/* Alignement */
		align-items: center;
		gap: 8px;
		padding: 6px;
		
		/* Display */
		display: flex;
		flex-wrap: wrap;

		/* Bakcground */
		background: transparent;

		/* Border */
		border: 0;
		border-right: 1px solid var(--line);

		/* Text */
		text-align: left;
	}

    .choice > span:last-child {
		/* Lenght */
		min-width: 0;

		/* Display */
		flex: 1 1 75px;
		overflow-wrap: anywhere;
	}

    .choice img, .frame-preview {
		/* Lenght */
		width: 42px;
		height: 42px;

		/* Display */
		flex: 0 0 42px;
		
		/* Border */
		border-radius: 50%;
		
		/* Object */
		object-fit: cover;
	}

    .choice b {
		/* Display */
		display: block;
		
		/* Text */
		font-size: 13px;
	}

    .choice small {
		/* Alignement */
		margin-top: 4px;

		/* Display */
		display: block;

		/* Text */
		font-size: 11px;
		line-height: 1.3;
	}
	
    .frame-preview {
		/* Display */
		outline: 2px solid var(--red);

		/* Border */
		border: 5px solid var(--ink);
	}

    .title-preview {
		/* Lenght */
		max-width: 100%;
		
		/* Alignement */
		padding: 6px;

		/* Display */
		overflow-wrap: anywhere;

		/* Background */
		background: rgba(214, 188, 148, .55);
		
		/* Border */
		border: 1px solid #33251a;
		
		/* Text */
		font-size: 11px;
	}

    .customize-cta {
		/* Lenght */
		min-width: 0;

		/* Alignement */
		align-content: center;
		gap: 6px; 
		
		/* Display */
		display: grid;
		justify-items: center;
		overflow-wrap: anywhere; 
		
		/* Text */
		text-align: center;
		font-size: 11px;
	}

    .ink-button {
		/* Lenght */
		max-width: 100%;
		
		/* Alignement */
		padding: 9px 14px;

		/* Display */
		color: #eee2cf;

		/* Background */
		background: var(--ink);

		/* Border */
		border: 0;
		border-radius: 50% 6px 40% 8px / 15% 10% 18% 10%;
		
		/* Text */
		font-size: 12px;
	}

    .customize-cta q {
		/* Text */
		font-style: italic;
	}

    .customize-cta em {
		/* Alignement */
		padding: 2px;

		/* Display */
		color: #f3d4b1;

		/* Background */
		background: var(--red);
		
		/* Text */
		font-style: normal;
	}

	.Profil_page {
		/* Lenght */
		grid-template-rows: minmax(0, 1fr);
	}

    @container profile-content (max-width: 760px) {
        .identity-card { grid-template-columns: 100px minmax(0, 1fr); }
        .level-block { grid-column: 1 / -1; }
        .enso-level { flex-basis: 58px; border-width: 6px; }
        .enso-level span { font-size: 26px; }
        .achievement-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .customization-content { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .choice { border: 0; }
    }
    @container profile-content (max-width: 420px) {
        .identity-card { grid-template-columns: minmax(0, 1fr); text-align: center; }
        .brush-line { margin-inline: auto; }
        .level-block { text-align: left; }
        .achievement-grid, .customization-content { grid-template-columns: minmax(0, 1fr); }
        .customize-cta { padding: 8px; }
    }
    @media (max-width: 900px) {
        .Profil_page { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); }
        .Profil_sidebar { padding: 8px 12px; }
        .Profil_kanji, .Profil_sidebar_quote { display: none; }
        .Profil_filters { flex-direction: row; flex-wrap: wrap; gap: 4px; }
        .Profil_filters button { min-height: 36px; padding: 7px 9px; font-size: 12px; }
        .Profil_content { padding: 12px; }
    }
    @media (max-height: 740px) {
        .Profil_content { padding-top: 16px; padding-bottom: 14px; gap: 8px; }
        .Profil_header p { margin-top: 4px; }
        .identity-card { padding-block: 8px; }
    }
    @media (prefers-reduced-motion: reduce) {
        .Profil_filters button { transition: none;}
    }
</style>