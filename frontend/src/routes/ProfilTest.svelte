<script lang="ts">
  type Presence = 'online' | 'playing' | 'away' | 'offline';

  type Friend = {
    name: string;
    avatar: string;
    status: string;
    presence: Presence;
  };

  type Achievement = {
    title: string;
    description: string;
    image: string;
    unlocked?: boolean;
    progress?: number;
  };

  export let player = {
    name: 'Kenshii',
    title: 'Disciple du vent',
    quote: 'Le calme est ma force.',
    level: 42,
    xp: 6500,
    xpTarget: 10000,
    avatar: '/assets/profile/avatar-kenshii.png'
  };

  export let activeTab: 'home' | 'history' | 'stats' | 'profile' = 'profile';

  const tabs = [
    { id: 'home', label: 'ACCUEIL', icon: '⛩' },
    { id: 'history', label: 'HISTORIQUE', icon: '▣' },
    { id: 'stats', label: 'STATS', icon: '▥' },
    { id: 'profile', label: 'PROFIL', icon: '♟' }
  ] as const;

  const achievements: Achievement[] = [
    { title: 'Premier pas', description: 'Remporter une partie.', image: '/assets/profile/achievement-lotus.png', unlocked: true },
    { title: 'Esprit du tigre', description: 'Gagner 10 parties.', image: '/assets/profile/achievement-tiger.png', unlocked: true },
    { title: 'Voie du temple', description: 'Gagner par le temple.', image: '/assets/profile/achievement-torii.png', unlocked: true },
    { title: 'Série parfaite', description: '4 / 5 victoires consécutives.', image: '/assets/profile/achievement-blades.png', progress: 80 },
    { title: 'Cent victoires', description: '73 / 100 victoires.', image: '/assets/profile/achievement-crane.png', progress: 73 },
    { title: 'Maître du dojo', description: 'Atteindre le niveau 50.', image: '/assets/profile/achievement-dragon.png', progress: 0 }
  ];

  const friends: Friend[] = [
    { name: 'RaiNeko', avatar: '/assets/profile/friend-raineko.png', status: 'En ligne', presence: 'online' },
    { name: 'Tsuki', avatar: '/assets/profile/friend-tsuki.png', status: 'En jeu', presence: 'playing' },
    { name: 'Daiko', avatar: '/assets/profile/friend-daiko.png', status: 'En ligne', presence: 'online' },
    { name: 'Mei', avatar: '/assets/profile/friend-mei.png', status: 'Absent', presence: 'away' },
    { name: 'Shiro', avatar: '/assets/profile/friend-shiro.png', status: 'Hors ligne', presence: 'offline' },
    { name: 'Akemi', avatar: '/assets/profile/friend-akemi.png', status: 'Hors ligne', presence: 'offline' },
    { name: 'Zenkai', avatar: '/assets/profile/friend-zenkai.png', status: 'Hors ligne', presence: 'offline' },
    { name: 'Yoru', avatar: '/assets/profile/friend-yoru.png', status: 'Hors ligne', presence: 'offline' }
  ];

  let profileSection: 'overview' | 'achievements' | 'customization' = 'overview';
  let friendSearch = '';
  let message = '';

  $: levelProgress = Math.min(100, Math.round((player.xp / player.xpTarget) * 100));
  $: filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(friendSearch.trim().toLowerCase())
  );

  function navigate(tab: typeof activeTab) {
    activeTab = tab;
    window.dispatchEvent(new CustomEvent('onitama:navigate', { detail: { tab } }));
  }

  function sendMessage() {
    const value = message.trim();
    if (!value) return;
    window.dispatchEvent(new CustomEvent('onitama:message', { detail: { message: value } }));
    message = '';
  }
</script>

<svelte:head>
  <title>Profil — Onitama</title>
  <meta name="description" content="Profil du joueur Onitama" />
</svelte:head>

<div class="profile-page">
  <div class="ink-corner top-left" aria-hidden="true"></div>
  <div class="ink-corner bottom-left" aria-hidden="true"></div>

  <header class="topbar">
    <a class="logo" href="/" aria-label="Onitama — accueil">
      <span>Onitama</span><b>棋</b>
    </a>

    <nav class="main-nav" aria-label="Navigation principale">
      {#each tabs as tab}
        <button
          class:active={activeTab === tab.id}
          type="button"
          aria-current={activeTab === tab.id ? 'page' : undefined}
          onclick={() => navigate(tab.id)}
        >
          <span class="nav-icon" aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      {/each}
    </nav>

    <div class="top-actions">
      <button type="button" aria-label="Paramètres">⚙</button>
      <button class="notification" type="button" aria-label="Notifications">♟<i></i></button>
      <button type="button" aria-label="Messages">✉</button>
    </div>
  </header>

  <aside class="profile-rail">
    <div class="kanji">道</div>
    <blockquote>« Chaque pas<br />façonne votre<br />légende. »</blockquote>
    <div class="seal">棋</div>
    <nav aria-label="Navigation du profil">
      <button class:active={profileSection === 'overview'} onclick={() => (profileSection = 'overview')} type="button">Vue d’ensemble</button>
      <button class:active={profileSection === 'achievements'} onclick={() => (profileSection = 'achievements')} type="button">Succès</button>
      <button class:active={profileSection === 'customization'} onclick={() => (profileSection = 'customization')} type="button">Personnalisation</button>
    </nav>
    <img class="rail-torii" src="/assets/profile/torii-decoration.png" alt="" />
  </aside>

  <main class="content">
    <section class="hero">
      <h1>Mon profil</h1>
      <p>Chaque pas façonne votre légende.</p>
    </section>

    <section class="identity-card parchment-card">
      <div class="avatar-block">
        <div class="avatar-ring">
          <img src={player.avatar} alt={`Avatar de ${player.name}`} />
          <button type="button" aria-label="Changer la photo">◉</button>
        </div>
        <button class="outline-button" type="button">Changer l’avatar</button>
      </div>

      <div class="identity-copy">
        <h2>{player.name} <button type="button" aria-label="Modifier le nom">✎</button></h2>
        <strong>{player.title} <button type="button" aria-label="Modifier le titre">✎</button></strong>
        <span class="brush-line"></span>
        <q>{player.quote}</q>
      </div>

      <div class="level-block">
        <div class="enso-level"><span>{player.level}</span></div>
        <div class="level-copy">
          <strong>NIVEAU</strong>
          <div class="progress"><span style={`width: ${levelProgress}%`}></span></div>
          <b>{levelProgress}%</b>
          <p>{player.xp.toLocaleString('fr-FR')} / {player.xpTarget.toLocaleString('fr-FR')} XP</p>
          <small>Niveau suivant : {player.level + 1}</small>
        </div>
      </div>
    </section>

    <section class="panel parchment-card" class:hidden={profileSection === 'customization'}>
      <header class="section-heading">
        <h2><span>◒</span> Succès de partie</h2>
        <div><b>12 / 32 débloqués</b><button type="button">Voir tous　›</button></div>
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

    <section class="customization parchment-card" class:featured={profileSection === 'customization'}>
      <header class="section-heading"><h2><span>◒</span> Personnalisation</h2></header>
      <div class="customization-content">
        <button class="choice" type="button">
          <img src={player.avatar} alt="" />
          <span><b>Avatar</b><small>Modifiez votre avatar de profil.</small></span>
        </button>
        <button class="choice" type="button">
          <span class="frame-preview"></span>
          <span><b>Cadre</b><small>Choisissez un cadre pour votre avatar.</small></span>
        </button>
        <button class="choice" type="button">
          <span class="title-preview">Disciple du vent</span>
          <span><b>Titre</b><small>Affichez votre titre favori.</small></span>
        </button>
        <div class="customize-cta">
          <button class="ink-button" type="button">Personnaliser</button>
          <q>L’apparence suit l’esprit.</q>
          <span>— 御 寺 間 —　<em>棋</em></span>
        </div>
      </div>
    </section>
  </main>

  <aside class="social-panel">
    <section class="social-profile">
      <div class="small-avatar"><img src={player.avatar} alt="" /><span>{player.level}</span></div>
      <div><h2>{player.name}</h2><p><i></i> En ligne</p></div>
      <button type="button" aria-label="Réduire">−</button>
      <button type="button" aria-label="Fermer">×</button>
    </section>

    <section class="friends-panel">
      <label class="search"><input bind:value={friendSearch} placeholder="Rechercher un ami..." /><span>⌕</span></label>
      <h3>⌄　AMIS (4/12)</h3>
      <div class="friend-list">
        {#each filteredFriends as friend}
          <button class:offline={friend.presence === 'offline'} type="button">
            <span class="friend-avatar"><img src={friend.avatar} alt="" /><i class={friend.presence}></i></span>
            <span><b>{friend.name}</b><small class={friend.presence}>{friend.status}</small></span>
            <em>•••</em>
          </button>
        {/each}
      </div>
    </section>

    <section class="chat-panel">
      <h3>DISCUSSIONS (2)</h3>
      <button class="conversation" type="button"><span class="chat-avatar">桜</span><span><b>Équipe Onitama</b><small>Tsuki : On se fait une ?</small></span><time>12:14</time></button>
      <button class="conversation" type="button"><span class="chat-avatar second">策</span><span><b>Stratégies</b><small>RaiNeko : Très bon move !</small></span><time>Hier</time></button>
      <button class="add-friend" type="button" aria-label="Ajouter un ami">♟＋</button>
      <form onsubmit={(event) => { event.preventDefault(); sendMessage(); }}>
        <input bind:value={message} placeholder="Écrire un message..." aria-label="Message" />
        <button type="submit" aria-label="Envoyer">➤</button>
      </form>
    </section>
  </aside>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #17120f; color: #17110c; font-family: Georgia, 'Times New Roman', serif; }
  :global(button), :global(input) { font: inherit; }
  :global(button) { color: inherit; }

  .profile-page {
    --paper: #ead9bc;
    --paper-light: #f3e7cf;
    --ink: #17110c;
    --red: #b90f12;
    --line: rgba(72, 45, 25, .36);
    min-height: 100vh;
    display: grid;
    grid-template: 120px 1fr / 214px minmax(650px, 1fr) 316px;
    overflow: hidden;
    position: relative;
    background:
      linear-gradient(rgba(245,231,204,.84), rgba(239,222,191,.92)),
      url('/assets/profile/parchment-texture.jpg') center/cover;
    border: 8px solid #110f0d;
    box-shadow: inset 0 0 0 3px #a91d1f, inset 0 0 70px #1a1009;
  }

  .topbar { grid-column: 1 / 3; display: flex; align-items: stretch; padding-left: 300px; border-bottom: 1px solid var(--line); background: rgba(247,237,216,.87); z-index: 3; }
  .logo { position: absolute; left: 26px; top: 6px; width: 264px; height: 175px; display: grid; place-content: center; text-decoration: none; color: #fff5dd; background: radial-gradient(circle, #090807 48%, transparent 49%), conic-gradient(from 10deg, #9f1115, #d63231, #891013, #d63231); border-radius: 50%; filter: drop-shadow(0 5px 1px #0b0908); transform: rotate(-2deg); z-index: 5; }
  .logo::after { content: ''; position: absolute; inset: 10px; border: 5px solid #150e0b; border-radius: 50%; }
  .logo span { font-size: 46px; font-style: italic; font-weight: 800; transform: rotate(-5deg); text-shadow: 4px 4px #120b08; z-index: 1; }
  .logo b { font-size: 30px; text-align: center; z-index: 1; }

  .main-nav { display: flex; flex: 1; justify-content: center; }
  .main-nav button { min-width: 145px; padding: 16px 28px 13px; border: 0; border-left: 1px solid rgba(48,32,20,.16); background: transparent; cursor: pointer; position: relative; font-weight: 700; }
  .main-nav button:last-child { border-right: 1px solid rgba(48,32,20,.16); }
  .nav-icon { display: block; font-size: 34px; line-height: 42px; }
  .main-nav button.active { color: var(--red); }
  .main-nav button.active::after { content: ''; position: absolute; left: 18%; right: 18%; bottom: 8px; height: 5px; background: var(--red); clip-path: polygon(0 55%, 88% 12%, 100% 62%, 14% 100%); }
  .top-actions { display: flex; align-items: center; gap: 8px; padding: 0 22px; }
  .top-actions button { width: 52px; height: 56px; border: 0; background: none; font-size: 28px; cursor: pointer; position: relative; }
  .notification i { position: absolute; width: 10px; height: 10px; background: var(--red); border-radius: 50%; right: 7px; top: 9px; }

  .profile-rail { grid-row: 2; padding: 96px 22px 20px 30px; position: relative; z-index: 2; background: linear-gradient(90deg, rgba(245,233,207,.92), rgba(237,219,186,.7)); border-right: 1px solid var(--line); }
  .kanji { font-size: 102px; line-height: .8; font-weight: 700; transform: rotate(-8deg); }
  blockquote { margin: 28px 0 16px; font-size: 20px; line-height: 1.35; }
  .seal, .achievement-seal { display: grid; place-items: center; background: var(--red); color: #fff0d8; border: 2px solid #f0d9b4; outline: 1px solid var(--red); }
  .seal { width: 46px; height: 52px; margin: 0 auto 30px; font-size: 28px; }
  .profile-rail nav { display: grid; gap: 6px; }
  .profile-rail nav button { text-align: left; padding: 12px 14px; border: 0; background: transparent; font-weight: 700; cursor: pointer; }
  .profile-rail nav button.active { color: #fff8e8; background: var(--red); clip-path: polygon(5% 7%, 91% 0, 100% 39%, 93% 89%, 12% 100%, 0 72%); text-shadow: 1px 1px #4b0908; }
  .rail-torii { position: absolute; left: 12px; bottom: 8px; width: 175px; max-height: 260px; object-fit: contain; }

  .content { grid-column: 2; grid-row: 2; padding: 78px 22px 28px; overflow: auto; position: relative; background: radial-gradient(circle at 58% 0, rgba(203,39,40,.18), transparent 23%), linear-gradient(rgba(241,226,199,.34), rgba(241,226,199,.65)), url('/assets/profile/mountain-banner.jpg') top center/100% 180px no-repeat; }
  .hero { margin: 0 20px 12px; }
  .hero h1 { margin: 0; font-size: 43px; }
  .hero p { margin: 0; font-size: 23px; }
  .parchment-card { background: rgba(244,231,207,.67); border: 1px solid var(--line); box-shadow: inset 0 0 25px rgba(100,67,35,.08); }
  .identity-card { min-height: 208px; display: grid; grid-template-columns: 220px 1fr 390px; gap: 22px; align-items: center; padding: 10px 24px; }
  .avatar-block { display: grid; justify-items: center; }
  .avatar-ring, .small-avatar { border-radius: 50%; background: #cf4f47; overflow: hidden; position: relative; }
  .avatar-ring { width: 155px; height: 155px; border: 4px solid var(--ink); box-shadow: 0 0 0 3px #e9d4af; }
  .avatar-ring img, .small-avatar img, .choice img, .friend-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-ring button { position: absolute; right: 5px; bottom: 5px; border: 0; border-radius: 50%; width: 38px; height: 38px; background: #171411; color: white; cursor: pointer; }
  .outline-button { width: 165px; margin-top: 4px; padding: 7px; border: 1px solid #3b2b1f; border-radius: 5px; background: rgba(255,255,255,.2); cursor: pointer; }
  .identity-copy h2 { margin: 0 0 8px; font-size: 36px; }
  .identity-copy h2 button, .identity-copy strong button { border: 0; background: transparent; font-size: 21px; cursor: pointer; }
  .identity-copy strong { font-size: 18px; }
  .brush-line { display: block; width: 250px; height: 7px; margin: 20px 0 10px; background: #18130f; clip-path: polygon(0 42%, 100% 0, 91% 64%, 5% 100%); }
  .identity-copy q { font-size: 21px; font-style: italic; }
  .level-block { display: flex; align-items: center; gap: 18px; }
  .enso-level { flex: 0 0 132px; height: 132px; display: grid; place-items: center; border: 13px solid #171411; border-radius: 48% 52% 46% 54%; outline: 3px solid rgba(23,20,17,.35); transform: rotate(-7deg); }
  .enso-level span { font-size: 56px; transform: rotate(7deg); }
  .level-copy { flex: 1; display: grid; grid-template-columns: 1fr auto; gap: 6px 10px; align-items: center; }
  .level-copy > strong, .level-copy p, .level-copy small { grid-column: 1 / -1; margin: 0; }
  .progress, .mini-progress > span { height: 15px; border: 1px solid rgba(50,30,20,.35); border-radius: 3px; overflow: hidden; background: rgba(80,60,40,.15); }
  .progress span, .mini-progress i { display: block; height: 100%; background: linear-gradient(90deg, #ba1718, #d22323); }

  .panel, .customization { margin-top: 10px; padding: 8px 10px 12px; }
  .panel.hidden { display: none; }
  .section-heading { height: 38px; display: flex; justify-content: space-between; align-items: center; }
  .section-heading h2 { margin: 0; font-size: 25px; }
  .section-heading h2 span { font-size: 31px; }
  .section-heading div { display: flex; gap: 34px; align-items: center; }
  .section-heading button { border: 0; background: transparent; color: var(--red); text-decoration: underline; cursor: pointer; }
  .achievement-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .achievement-grid article { min-height: 105px; border: 1px solid var(--line); border-radius: 4px; display: grid; grid-template-columns: 118px 1fr 28px; align-items: center; padding: 6px; position: relative; background: rgba(245,230,203,.35); }
  .achievement-grid article > img { width: 110px; height: 88px; object-fit: contain; }
  .achievement-grid h3, .achievement-grid p { margin: 0 0 7px; }
  .achievement-grid h3 { font-size: 17px; }
  .achievement-grid p { font-size: 14px; }
  .achievement-seal { width: 26px; height: 32px; align-self: center; }
  .locked { filter: grayscale(.8); opacity: .82; }
  .lock { font-size: 23px; }
  .mini-progress { display: flex; align-items: center; gap: 7px; }
  .mini-progress > span { width: 135px; height: 11px; }
  .mini-progress b { font-size: 13px; }

  .customization.featured { min-height: 330px; }
  .customization-content { display: grid; grid-template-columns: 1fr 1fr 1.35fr 1.15fr; min-height: 125px; }
  .choice { border: 0; border-right: 1px solid var(--line); background: transparent; display: grid; grid-template-columns: 92px 1fr; align-items: center; text-align: left; cursor: pointer; }
  .choice img { width: 82px; height: 82px; border-radius: 50%; }
  .choice b, .choice small { display: block; }
  .choice small { margin-top: 5px; line-height: 1.2; }
  .frame-preview { width: 82px; height: 82px; border: 10px solid #16120e; border-radius: 50%; outline: 4px solid #b61a1d; }
  .title-preview { min-width: 155px; padding: 14px 12px; background: rgba(214,188,148,.55); border: 2px solid #33251a; box-shadow: inset 0 0 8px #76593a; text-align: center; }
  .customize-cta { display: grid; justify-items: center; align-content: center; gap: 8px; }
  .ink-button { min-width: 190px; padding: 11px 25px; border: 0; color: white; background: #171411; cursor: pointer; clip-path: polygon(5% 14%, 91% 0, 100% 50%, 92% 89%, 10% 100%, 0 60%); }
  .customize-cta q { font-style: italic; }
  .customize-cta em { background: var(--red); color: white; padding: 6px; font-style: normal; }

  .social-panel { grid-column: 3; grid-row: 1 / 3; z-index: 6; display: grid; grid-template-rows: 155px minmax(410px, 1fr) 300px; background: #120f0d; color: #f4e7cf; border-left: 5px solid #160f0c; box-shadow: -5px 0 14px rgba(0,0,0,.35); }
  .social-profile { display: flex; align-items: center; gap: 14px; padding: 20px 18px; position: relative; border-bottom: 2px solid #a7191a; background: radial-gradient(circle at 20% 30%, rgba(180,31,33,.22), transparent 34%); }
  .small-avatar { width: 88px; height: 88px; border: 2px solid #e4ca9f; }
  .small-avatar span { position: absolute; left: 28px; bottom: 0; background: #100f0e; border: 1px solid #dbc69f; border-radius: 50%; padding: 2px 8px; }
  .social-profile h2, .social-profile p { margin: 0 0 6px; }
  .social-profile p { color: #19b956; }
  .social-profile p i { display: inline-block; width: 11px; height: 11px; background: #17b653; border-radius: 50%; }
  .social-profile > button { position: absolute; top: 8px; border: 0; background: transparent; color: #eee0c8; font-size: 28px; cursor: pointer; }
  .social-profile > button:nth-of-type(1) { right: 42px; }
  .social-profile > button:nth-of-type(2) { right: 10px; }
  .friends-panel { overflow: hidden; background: linear-gradient(rgba(245,232,207,.98), rgba(235,215,181,.98)), url('/assets/profile/parchment-texture.jpg'); color: var(--ink); padding: 10px 13px; }
  .search { display: flex; height: 37px; border: 1px solid #5b4431; border-radius: 5px; background: rgba(255,255,255,.34); }
  .search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; padding: 0 12px; }
  .search span { font-size: 25px; padding: 3px 8px; }
  .friends-panel h3 { margin: 12px 2px 6px; font-size: 16px; }
  .friend-list { display: grid; }
  .friend-list button { display: grid; grid-template-columns: 50px 1fr 30px; align-items: center; min-height: 55px; border: 0; background: transparent; text-align: left; cursor: pointer; }
  .friend-list button:hover { background: rgba(173,27,29,.08); }
  .friend-list button.offline { opacity: .6; filter: grayscale(.7); }
  .friend-avatar { width: 44px; height: 44px; border-radius: 50%; position: relative; overflow: visible; }
  .friend-avatar img { border-radius: 50%; }
  .friend-avatar i { position: absolute; right: -1px; bottom: 1px; width: 11px; height: 11px; border-radius: 50%; border: 1px solid #ead8b9; }
  .online { color: #118f45; }.playing { color: #1269a7; }.away { color: #b7790b; }.offline { color: #5e5b58; }
  .friend-avatar i.online { background: #19b956; }.friend-avatar i.playing { background: #1686cf; }.friend-avatar i.away { background: #d99312; }.friend-avatar i.offline { background: #777; }
  .friend-list b, .friend-list small { display: block; }
  .friend-list small { margin-top: 2px; }
  .friend-list em { font-style: normal; }

  .chat-panel { position: relative; padding-bottom: 64px; overflow: hidden; }
  .chat-panel > h3 { margin: 0; padding: 11px 14px; border-bottom: 1px solid #59483a; font-size: 16px; }
  .conversation { width: calc(100% - 20px); margin: 4px 10px; display: grid; grid-template-columns: 50px 1fr 40px; align-items: center; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
  .chat-avatar { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: #d35651; color: #17110c; font-weight: 700; }
  .chat-avatar.second { background: #d8b77e; }
  .conversation b, .conversation small { display: block; }
  .conversation small, .conversation time { color: #bfb09a; }
  .add-friend { margin: 4px 18px; border: 0; background: transparent; color: #f1dfc0; font-size: 28px; cursor: pointer; }
  .chat-panel form { position: absolute; left: 13px; right: 13px; bottom: 12px; height: 52px; display: flex; border: 1px solid #8f7e66; border-radius: 6px; background: #191613; }
  .chat-panel form input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: #f2e5cf; padding: 0 13px; }
  .chat-panel form button { width: 48px; border: 0; background: transparent; color: #f2e5cf; font-size: 23px; cursor: pointer; }

  .ink-corner { position: fixed; width: 250px; height: 180px; pointer-events: none; z-index: 10; background: url('/assets/profile/cherry-ink-corner.png') center/contain no-repeat; }
  .top-left { left: -30px; top: -28px; }
  .bottom-left { left: -24px; bottom: -22px; transform: rotate(-80deg); }

  @media (max-width: 1250px) {
    .profile-page { grid-template-columns: 175px minmax(580px, 1fr) 285px; }
    .topbar { padding-left: 245px; }
    .logo { width: 215px; height: 150px; }
    .logo span { font-size: 38px; }
    .main-nav button { min-width: 105px; padding-inline: 14px; }
    .identity-card { grid-template-columns: 190px 1fr; }
    .level-block { grid-column: 1 / -1; justify-self: center; }
    .achievement-grid { grid-template-columns: repeat(2, 1fr); }
    .customization-content { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 900px) {
    .profile-page { display: block; overflow: visible; padding-top: 78px; border-width: 4px; }
    .topbar { position: fixed; inset: 4px 4px auto; height: 74px; padding-left: 80px; z-index: 20; }
    .logo { left: 8px; top: 3px; width: 74px; height: 68px; border-radius: 45%; }
    .logo span { font-size: 18px; }.logo b { display: none; }
    .main-nav { overflow-x: auto; justify-content: flex-start; }
    .main-nav button { min-width: 82px; padding: 6px; font-size: 11px; }
    .nav-icon { font-size: 20px; line-height: 25px; }
    .top-actions { display: none; }
    .profile-rail { display: none; }
    .content { padding: 50px 10px 15px; overflow: visible; }
    .hero { margin-left: 8px; }.hero h1 { font-size: 34px; }
    .identity-card { grid-template-columns: 1fr; text-align: center; }
    .brush-line { margin-inline: auto; }
    .level-block { flex-wrap: wrap; justify-content: center; }
    .achievement-grid { grid-template-columns: 1fr; }
    .customization-content { grid-template-columns: 1fr; }
    .choice { border-right: 0; border-bottom: 1px solid var(--line); padding: 10px; }
    .social-panel { display: block; }
    .social-profile { min-height: 130px; }
    .friends-panel { max-height: 410px; }
    .chat-panel { min-height: 290px; }
    .ink-corner { display: none; }
  }
</style>
