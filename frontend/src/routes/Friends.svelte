<script lang="ts">
	import Search from "@lucide/svelte/icons/search";

	const	Friends_Test =
	[{login: "Test_Online", status: "Online", avatar: "../assets/test-inline.png"},
	{login: "Test_InGame", status: "InGame", avatar: "../assets/test-afk.png"},
	{login: "Test_Afk", status: "Afk", avatar: "../assets/test-offline.png"}]

  	const Friends_Offline_Test = 
	[{login: "Test_Offline",avatar: "../assets/test-offline.png"}]
</script>

<aside class="friends_panel">
	<section class="profile_panel">
		<img class="profile_background" src="../assets/profil-vide.png" alt=""/>
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

<style>
	.friends_panel {
		/* Position */
		position: fixed;
		right: 0;
		top: 0;

		/* Lenght */
		width: 20vw;
		min-width: 285px;
		height: 100vh;
		grid-template-rows:clamp(145px, 15.5vh, 165px) minmax(0, 1fr);

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

	.profile_panel {
		/* Position */
		position: relative;

		/* Lenght */
		width: 100%;
		height: 100%;

		/* Display */
		overflow: hidden;
	}

	.profile_background {
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

	.profile_content {
		/* Position */
		position: relative;
		z-index: 1;

		/* Lenght */
		width: 100%;
		height: 100%;

		/* Alignement */
		align-items: center;
		gap:clamp(10px, 1vw, 16px);
		padding: 10px clamp(12px, 1.3vw, 20px);

		/* Display */
		display: flex;
	}

	.profile_avatar_wrapper {
		/* Position */
		position: relative;

		/* Lenght */
		width: clamp(70px, 6vw, 90px);
		height: clamp(70px, 6vw, 90px);
	}

	.profile_avatar {
		/* Lenght */
		width: 100%;
		height: 100%;

		/* Display */
		display: block;

		/* Object */
		object-fit: cover;
	}

	.profile_level {
		/* Position */
		position: absolute;
		left: 50%;
		bottom: -7px;

		/* Lenght */
		min-width: 38px;

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

	.profile_infos {
		/* Lenght */
		gap: 5px;

		/* Display */
		display: flex;
		flex-direction: column;
	}

	.profile_infos strong {
		/* Display */
		color: #f2e4cc;

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(17px, 1.5vw, 22px);
	}

	.profile_status {
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

	.status_dot,
	.friend_status_dot {
		/* Display */
		display: block;

		/* Border */
		border-radius: 50%;
	}

	.status_dot {
		/* Lenght */
		width: 10px;
		height: 10px;
	}

	.status_dot.online,
	.friend_status_dot.online {
		/* Background */
		background: #24b74e;
	}

	.friend_status_dot.ingame {
		/* Background */
		background: #159ed4;
	}

	.friend_status_dot.afk {
		/* Background */
		background: #d89528;
	}

	.friends_content {
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

	.friends_search {
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

	.friends_search input {
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

	.friends_search input::placeholder {
		/* Display */
		color:rgba(73, 58, 45, 0.7);
	}

	.search_button {
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

	.friends_group {
		/* Alignement */
		margin-top: 10px;

		/* Display */
		flex-shrink: 0;
	}

	.friends_group_title {
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

	.group_arrow {
		/* Lenght */
		width: 16px;

		/* Text */
		font-size: 19px;
		line-height: 1;
	}

	.friend_entry {
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

	.friend_entry:hover {
		/* Animation */
		transform:translateX(2px);

		/* Background */
		background:rgba(50, 37, 25, 0.08);
	}

	.friend_avatar_wrapper {
		/* Position */
		position: relative;

		/* Lenght */
		width: 42px;
		height: 42px;
	}

	.friend_avatar {
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

	.friend_status_dot {
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

	.friend_infos {
		/* Lenght */
		min-width: 0;

		/* Alignement */
		gap: 1px;

		/* Display */
		display: flex;
		flex-direction: column;
	}

	.friend_infos strong {
		/* Display */
		color: #211913;
		overflow: hidden;

		/* Text */
		font-family: Georgia, serif;
		font-size:clamp(13px, 1vw, 16px);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.friend_infos span {
		/* Display */
		color: #75604a;

		/* Text */
		font-family:Georgia, serif;
		font-size:clamp(11px, 0.82vw, 13px);
	}

	.friend_options {
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

	.friend_options:hover {
		/* Display */
		opacity: 1;

		/* Animation */
		transform: scale(1.15);
	}

	.offline_group {
		/* Alignement */
		margin-top: 4px;
	}

	.offline_friend {
		/* Lenght */
		grid-template-columns:44px minmax(0, 1fr);

		/* Display */
		opacity: 0.48;
	}

	.offline_friend:hover {
		/* Display */
		opacity: 0.65;
	}

	.friend_requests {
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

	.friend_requests > span {
		/* Text */
		font-size: 25px;
	}

	.friends_footer {
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

	.friends_footer_background {
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

	.friends_footer_content {
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

	.friends_footer_content button {
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

	.friends_footer_content button:hover {
		/* Animation */
		transform: scale(1.12);
	}

	.friends_footer_content button img {
		/* Lenght */
		width: 27px;
		height: 27px;

		/* Object */
		object-fit: contain;
	}

	.friends_footer_separator {
		/* Lenght */
		width: 1px;
		height: 36px;

		/* Background */
		background:rgba(239, 222, 194, 0.24);
	}

</style>