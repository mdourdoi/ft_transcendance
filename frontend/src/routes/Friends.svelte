<script lang="ts">
	import Search from "@lucide/svelte/icons/search";

	type Friend = { id: string; login: string; status: string; avatar: string };

	let friends: Friend[] = [];
	let	Popup = '';
	let	selectedId = '';

	const	Friends_Test =
	[{login: "Test_Online", status: "Online", avatar: "../assets/home/avatar/test-inline.png"},
	{login: "Test_InGame", status: "InGame", avatar: "../assets/home/avatar/test-afk.png"},
	{login: "Test_Afk", status: "Afk", avatar: "../assets/home/avatar/test-offline.png"}]

  	const Friends_Offline_Test = 
	[{login: "Test_Offline",avatar: "../assets/home/avatar/test-offline.png"},
	{login: "Test_Offline",avatar: "../assets/home/avatar/test-offline.png"},
	{login: "Test_Offline",avatar: "../assets/home/avatar/test-offline.png"},
	{login: "Test_Offline",avatar: "../assets/home/avatar/test-offline.png"},
	{login: "Test_Offline",avatar: "../assets/home/avatar/test-offline.png"},
	{login: "Test_Offline",avatar: "../assets/home/avatar/test-offline.png"},
	{login: "Test_Offline",avatar: "../assets/home/avatar/test-offline.png"},
	{login: "Test_Offline",avatar: "../assets/home/avatar/test-offline.png"},
	{login: "Test_Offline",avatar: "../assets/home/avatar/test-offline.png"}]

	$: selected = friends.find(friend => friend.id === selectedId);

</script>

<aside class="Friends_panel">
	<section class="Profil_panel">
		<img class="Profil_background" src="../assets/home/background/profil-vide.png" alt=""/>
		<div class="Profil_content">
			<div class="Profil_avatar_wrapper">
				<img class="Profil_avatar" src="../assets/home/avatar/avatar-kenshii.png" alt="Kenshii"/>
				<span class="Profil_level"> 42 </span>
			</div>
			<div class="Profil_infos">
				<strong>Kenshii</strong>
				<span class="Profil_status">
					<span class="Status_online"></span>
					En ligne
				</span>
			</div>
		</div>
	</section>

	<section class="Friends_content">
		<div class="Friends_search">
			<input type="text" placeholder="Rechercher un ami..."/>
			<button class="Search_button" aria-label="Rechercher">
				<Search size={21} />
			</button>
		</div>

		<div class="Friends_group">
			<div class="Friends_group_title">
				<span class="Friends_arrow"> ⌄ </span>
				<strong>
					AMIS ({Friends_Test.length}/{Friends_Offline_Test.length + Friends_Test.length})
				</strong>
			</div>
			{#each Friends_Test as friend}
				<button class="Friend_entry">
					<div class="Friend_avatar_wrapper">
						<img class="Friend_avatar" src={friend.avatar} alt={friend.login}/>
						<span
							class:Online={friend.status === "Online"}
							class:Ingame={friend.status === "InGame"}
							class:Afk={friend.status === "Afk"}
							class="Friend_status"
						></span>
					</div>
					<div class="Friend_infos">
						<strong> {friend.login}</strong>
						<span
							class:Online_text={friend.status === "Online"}
							class:Ingame_text={friend.status === "InGame"}
							class:Afk_text={friend.status === "Afk"}>
							{#if friend.status === "Online"}
								En ligne
							{:else if friend.status === "InGame"}
								En jeu
							{:else}
								Absent
							{/if}
						</span>
					</div>
					<div class="Friend_options" aria-label="Options"> ••• </div>
				</button>
			{/each}
		</div>
		<div class="Friends_group Offline_group">
			<div class="Friends_group_title">
				<span class="Friends_arrow"> ⌄ </span>
				<strong> HORS LIGNE ({Friends_Offline_Test.length}) </strong>
			</div>
			{#each Friends_Offline_Test as friend}
				<button class="Friend_entry Offline_friend">
					<div class="Friend_avatar_wrapper">
						<img class="Friend_avatar" src={friend.avatar} alt={friend.login}/>
					</div>
					<div class="Friend_infos">
						<strong> {friend.login} </strong>
						<span>Hors ligne</span>
					</div>
				</button>
			{/each}
		</div>
		<button class="Friend_requests">
			<span> › </span>
			<strong> DEMANDES (1) </strong>
		</button>
	</section>
	<footer class="Friends_footer">
		<img class="Friends_footer_background" src="../assets/home/background/social-footer-base.png" alt="" />
		<div class="Friends_footer_content">
			<button aria-label="Messages" onclick={() => Popup = "message"}>
				<img src="../assets/home/icone/message.png" alt="Messages"/>
			</button>
			<div class="Friends_footer_separator"></div>
			<button aria-label="Ajouter un ami" onclick={() => Popup = "add"}>
				<img src="../assets/home/icone/add-friend.png" alt="Ajouter un ami"/>
			</button>
		</div>
	</footer>
</aside>


<aside class="Popup" class:hidden={Popup === ''}>
	<header class="Social_header">
		<!-- {Popup === 'add' ? 'Ajouter un contact' : Popup === 'message' ? 'Messagerie' : 'Demandes d’amis'} -->
		<div><small>ONITAMA · LE DOJO</small><h2>test</h2></div>
		<div class="Drawer_controls"><button type="button" onclick={() => Popup = ""} aria-label="Fermer">×</button></div>
	</header>
	{#if Popup === "message"}
		<label for="conversation_contact">Choisir un ami</label>
		<select id="conversation_contact" value={selectedId}  onchange={(event) => { const friend = friends.find(f => f.id === event.currentTarget.value);}}>
			<option value="" disabled>Choisis un contact…</option>
			{#each friends as friend (friend.id)}<option value={friend.id}>{friend.login}</option>{/each}
		</select>
		{#if selected}
			<div class="Conversation_heading"><h3>{selected.login}</h3><button type="button"  onclick={() => selected}>Actualiser</button></div>
			<div class="Conversation_history" aria-label="Historique des messages" aria-live="polite" ></div>
			<form class="Social_form">
				<!-- onsubmit={} -->
				<label for="message-text">Ton message</label>
				<textarea id="message-text" maxlength="2000" rows="3" placeholder="Écris ton message…"></textarea>
				<button class="Social_action" type="submit">Button</button>
			</form>
		{:else}
			<p>Sélectionne un ami pour ouvrir sa conversation.</p>
		{/if}
	{:else if Popup === "add"}
		<!-- onsubmit={} -->
		<form class="Social_form">
			<label for="contact_login">Pseudo du contact</label>
			<input id="contact_login" maxlength="40" autocomplete="off" placeholder=""/>
			<button class="Social_action" type="submit">Button</button>
		</form>
	<!-- {:else} -->
	{/if}
</aside>

<style>
	.Friends_panel {
		/* Position */
		position: fixed;
		right: 0;
		top: 0;

		/* Lenght */
		width: 20vw;
		/* min-width: 285px; */
		height: 100vh;
		grid-template-rows:15.5vh minmax(0, 1fr);

		/* Alignement */
		padding: 5px 5px 0px;

		/* Display */
		display: grid;
		overflow: hidden;

		/* Background */
		background-size: cover;

		/* Object */
		object-fit: cover;
	}

	.Profil_panel {
		/* Position */
		position: relative;

		/* Lenght */
		width: 100%;
		height: 100%;

		/* Display */
		overflow: hidden;
	}

	.Profil_background {
		/* Position */
		position: absolute;
		inset: 0;
		z-index: 0;

		/* Lenght */
		width: 100%;
		height: 100%;

		/* Display */
		pointer-events: none;

		/* Object */
		object-fit: fill;
	}

	.Profil_content {
		/* Position */
		position: relative;
		z-index: 1;

		/* Lenght */
		width: 100%;
		height: 100%;

		/* Alignement */
		align-items: center;
		gap: 1vw;
		padding: 10px 1.3vw;

		/* Display */
		display: flex;
	}

	.Profil_avatar_wrapper {
		/* Position */
		position: relative;

		/* Lenght */
		width: 6vw;
		height: 6vw;
	}

	.Profil_avatar {
		/* Lenght */
		width: 100%;
		height: 100%;

		/* Display */
		display: block;

		/* Object */
		object-fit: cover;
	}

	.Profil_level {
		/* Position */
		position: absolute;
		left: 50%;
		bottom: -7px;

		/* Lenght */
		/* min-width: 38px; */

		/* Alignement */
		padding:2px 8px;

		/* Display */
		color: #eee0c6;

		/* Animation */
		transform: translateX(-50%);

		/* Background */
		background: #18130f;

		/* Border */
		border: 2px solid #bca077;
		border-radius: 20px;

		/* Text */
		text-align: center;
		font-family:Georgia, serif;
		font-size: 15px;
	}

	.Profil_infos {
		/* Lenght */
		gap: 5px;

		/* Display */
		display: flex;
		flex-direction: column;
	}

	.Profil_infos strong {
		/* Display */
		color: #f2e4cc;

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(17px, 1.5vw, 22px);
	}

	.Profil_status {
		/* Alignement */
		align-items: center;
		gap: 7px;

		/* Display */
		display: flex;
		color: #87ba5e;

		/* Text */
		font-family:Georgia, serif;
		font-size: 14px;
	}

	.status,
	.Friend_status {
		/* Display */
		display: block;

		/* Border */
		border-radius: 50%;
	}

	.status {
		/* Lenght */
		width: 10px;
		height: 10px;
	}

	.status.Online,
	.Friend_status.Online {
		/* Background */
		background: #24b74e;
	}

	.Friend_status.Ingame {
		/* Background */
		background: #159ed4;
	}

	.Friend_status.Afk {
		/* Background */
		background: #d89528;
	}

	.Friends_content {
		/* Lenght */
		min-height: 0;

		/* Alignement */
		padding:7px 7px 0;

		/* Display */
		display: flex;
		flex-direction: column;
		overflow-y: auto;

		/* Scrollbar */
		scrollbar-width: thin;
		scrollbar-color:rgba(48, 37, 27, 0.4) transparent;
	}

	.Friends_search {
		/* Lenght */
		width: 100%;
		height: 40px;

		/* Alignement */
		align-items: center;

		/* Display */
		display: flex;
		flex-shrink: 0;
		overflow: hidden;

		/* Background */
		background:rgba(248, 231, 203, 0.7);

		/* Border */
		border:1px solid rgba(49, 36, 26, 0.8);
		border-radius: 3px;
	}

	.Friends_search input {
		/* Lenght */
		min-width: 0;
		height: 100%;

		/* Alignement */
		padding:0 10px;

		/* Display */
		color: #4a3b2e;
		flex: 1;
		outline: none;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Text */
		font-family: Georgia,serif;
		font-size:clamp(12px, 0.95vw, 15px);
	}

	.Friends_search input::placeholder {
		/* Display */
		color:rgba(73, 58, 45, 0.7);
	}

	.Search_button {
		/* Lenght */
		width: 38px;
		height: 38px;

		/* Display */
		display: flex;
		color: #18130f;
		flex-shrink: 0;
		justify-content: center;

		/* Alignement */
		align-items: center;
		padding: 0;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Cursor */
		cursor: pointer;
	}

	.Friends_group {
		/* Alignement */
		margin-top: 10px;

		/* Display */
		flex-shrink: 0;
	}

	.Friends_group_title {
		/* Lenght */
		height: 31px;

		/* Alignement */
		align-items: center;
		gap: 6px;
		padding: 0 2px;

		/* Display */
		display: flex;
		color: #231a14;

		/* Text */
		font-family: Georgia, serif;
		font-size:clamp(12px, 0.9vw, 15px);
	}

	.Friends_arrow {
		/* Lenght */
		width: 16px;

		/* Text */
		font-size: 19px;
		line-height: 1;
	}

	.Friend_entry {
		/* Position */
		position: relative;

		/* Lenght */
		width: 100%;
		min-height: 55px;

		/* Alignement */
		align-items: center;
		gap: 9px;
		padding:4px 4px;

		/* Display */
		display: grid;
		grid-template-columns:44px minmax(0, 1fr) 28px;

		/* Animation */
		transition:background 150ms ease, transform 150ms ease;

		/* Border */
		border-radius: 5px;

		/* Cursor */
		cursor: pointer;
	}

	.Friend_entry:hover {
		/* Animation */
		transform:translateX(2px);

		/* Background */
		background:rgba(50, 37, 25, 0.08);
	}

	.Friend_avatar_wrapper {
		/* Position */
		position: relative;

		/* Lenght */
		width: 42px;
		height: 42px;
	}

	.Friend_avatar {
		/* Lenght */
		width: 100%;
		height: 100%;

		/* Display */
		display: block;

		/* Border */
		border-radius: 50%;

		/* Object */
		object-fit: cover;
	}

	.Friend_status {
		/* Position */
		position: absolute;
		right: -1px;
		bottom: 0;

		/* Lenght */
		width: 11px;
		height: 11px;

		/* Border */
		border:2px solid #e7cc9f;
	}

	.Friend_infos {
		/* Lenght */
		min-width: 0;

		/* Alignement */
		gap: 1px;

		/* Display */
		display: flex;
		flex-direction: column;
	}

	.Friend_infos strong {
		/* Display */
		color: #211913;
		overflow: hidden;

		/* Text */
		font-family: Georgia, serif;
		font-size:clamp(13px, 1vw, 16px);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.Friend_infos span {
		/* Display */
		color: #75604a;

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(11px, 0.82vw, 13px);
	}

	.Friend_options {
		/* Lenght */
		width: 27px;
		height: 27px;

		/* Alignement */
		align-items: center;
		justify-content: center;
		padding: 0;

		/* Display */
		display: flex;
		color: #2b2119;
		opacity: 0.8;

		/* Animation */
		transition:opacity 130ms ease,transform 130ms ease;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Cursor */
		cursor: pointer;

		/* Text */
		font-size: 17px;
	}

	.Friend_options:hover {
		/* Display */
		opacity: 1;

		/* Animation */
		transform: scale(1.15);
	}

	.Offline_group {
		/* Alignement */
		margin-top: 4px;
	}

	.Offline_friend {
		/* Lenght */
		grid-template-columns:44px minmax(0, 1fr);

		/* Display */
		opacity: 0.48;
	}

	.Offline_friend:hover {
		/* Display */
		opacity: 0.65;
	}

	.Friend_requests {
		/* Lenght */
		width: 100%;
		min-height: 42px;

		/* Alignement */
		align-items: center;
		gap: 7px;
		padding:5px 4px;

		/* Display */
		display: flex;
		color: #241b14;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Cursor */
		cursor: pointer;

		/* Text */
		font-family:Georgia,serif;
		font-size:clamp(12px, 0.9vw, 15px);
		text-align: left;
	}

	.Friend_requests > span {
		/* Text */
		font-size: 25px;
	}

	.Friends_footer {
		/* Position */
		position: relative;

		/* Lenght */
		width: 100%;
		height: 100%;

		/* Alignement */
		align-self: end;

		/* Display */
		overflow: hidden;
	}

	.Friends_footer_background {
		/* Position */
		position: absolute;
		inset: 0;
		z-index: 0;

		/* Lenght */
		width: 100%;
		height: 100%;

		/* Object */
		object-fit: fill;

		/* Cursor */
		pointer-events: none;
	}

	.Friends_footer_content {
		/* Position */
		position: relative;
		z-index: 1;

		/* Lenght */
		width: 100%;
		height: 100%;

		/* Alignement */
		align-items: center;

		/* Display */
		display: flex;
		justify-content: center;
	}

	.Friends_footer_content button {
		/* Lenght */
		width: 62px;
		height: 55px;

		/* Alignement */
		align-items: center;
		padding: 0;

		/* Display */
		display: flex;
		justify-content: center;

		/* Animation */
		transition:transform 150ms ease;

		/* Background */
		background: transparent;

		/* Border */
		border: none;

		/* Cursor */
		cursor: pointer;
	}

	.Friends_footer_content button:hover {
		/* Animation */
		transform: scale(1.12);
	}

	.Friends_footer_content button img {
		/* Lenght */
		width: 27px;
		height: 27px;

		/* Object */
		object-fit: contain;
	}

	.Friends_footer_separator {
		/* Lenght */
		width: 1px;
		height: 36px;

		/* Background */
		background:rgba(239, 222, 194, 0.24);
	}

	.Popup {
		/* Lenght */
		width:min(620px,calc(100vw - 28px));
		max-height:86dvh;

		/* Alignement */
		padding:24px;

		/* Display */
		color:#30251b;
		overflow-y:auto;

		/* Background */
		background:#f1e4cd;

		/* Border */
		border:3px double #92724c;
		border-radius:8px;
		box-sizing:border-box;
		box-shadow:0 20px 80px #0006;

		/* Text */
		font-family:Georgia,serif;
	}
	
	.Social_header {
		/* Alignement */
		align-items:center;
		gap:12px;

		/* Display */
		display:flex;
		justify-content:space-between;
	}

	.Social_header h2 {
		/* Alignement */
		margin:6px 0 16px;
	}

	.Social_header button {
		/* Background */
		background:transparent;

		/* Border */
		border:0;

		/* Text */
		font-size:28px;
	}

	.Social_notice {
		/* Alignement */
		padding:12px;

		/* Background */
		background:#dfceb3;

		/* Text */
		font-size:13px;
		line-height:1.5;
	}

	.Social_form {
		/* Display */
		display:grid;

		/* Alignement */
		gap:10px;
		margin-top:16px;
	}

	.Social_dialog input, .Social_dialog select, .Social_dialog textarea {
		/* Lenght */
		width:100%;

		/* Alignement */
		padding:10px;

		/* Display */
		color:#30251b;

		/* Background */
		background:#fff9ec;

		/* Border */
		border:1px solid #92724c;
		border-radius:3px;
		box-sizing:border-box;

		/* Text */
		font:inherit;
	}

	.Social_dialog select {
		/* Alignement */
		margin-top:8px;
	}

	.Social_dialog textarea {
		/* Lenght */
		resize:vertical;
	}

	.Social_dialog button {
		/* Cursor */
		cursor:pointer;
	}

	.Social_action {
		/* Alignement */
		padding:11px 16px;

		/* Display */
		color:#f8ead1;

		/* Background */
		background:#37281d;

		/* Border */
		border:1px solid #92724c;
		border-radius:3px;

		/* Text */
		font:inherit;
	}

	.Social_dialog button:disabled {
		/* Display */
		opacity:.5;

		/* Cursor */
		cursor:wait;
	}

	.Social_dialog :focus-visible, .Friends_panel :focus-visible {
		/* Border */
		outline:2px solid #ac573f;
		outline-offset:3px;
	}

	.Social_error {
		/* Display */
		color:#963826;
	}

	.Conversation_history {
		/* Lenght */
		height:230px;

		/* Alignement */
		padding:12px;

		/* Display */
		overflow-y:auto;

		/* Background */
		background:#e7d7bc;

		/* Border */
		border:1px solid #b7a184;
	}

	.Conversation_history article {
		/* Lenght */
		max-width:85%;
		width:fit-content;

		/* Alignement */
		padding:10px 13px;
		margin:0 0 12px;

		/* Display */
		overflow-wrap:anywhere;

		/* Background */
		background:#fff7e6;

		/* Border */
		border-radius:8px;
	}

	.Conversation_history article.Mine {
		/* Alignement */
		margin-left:auto;

		/* Background */
		background:#d3dfce;
	}

	.Conversation_history article p {
		/* Alignement */
		margin:5px 0 0;

		/* Text */
		white-space:pre-wrap;
	}

	.Conversation_history small {
		/* Text */
		font-size:11px;
	}

	.Social_dialog {
		/* Position */
		position:fixed;
		z-index:90;
		right:calc(var(--friends-width,20vw) + 10px);
		bottom:12px;

		/* Lenght */
		width:min(390px,calc(100vw - 24px));
		max-height:calc(100dvh - var(--topbar-height,80px) - 24px);

		/* Alignement */
		margin:0;
		padding:16px;
	}

	.Social_dialog[hidden] {
		/* Display */
		display:none;
	}

	.Drawer_controls {
		/* Alignement */
		gap:8px;

		/* Display */
		display:flex;
	}

	.Social_header h2 {
		/* Text */
		font-size:20px;
	}

	.Conversation_history {
		/* Lenght */
		height:clamp(100px,25dvh,230px);
	}

	@media(max-width:750px) {
		.Social_dialog {right:12px;}
	}

</style>	