<script lang="ts">
	import logo from '../../assets/logo-onitama2.png';
	import frame from '../../assets/frame.png';
	import strace from '../../assets/Icone/strace.png';
	import cadre from '../../assets/bouton_outline.png';
	import logomail from '../../assets/Icone/email.png';
	import logopassword from '../../assets/Icone/Maj.png';
	import bloque from '../../assets/Icone/hide.png';
	import user from '../../assets/Icone/user.png';
	import debloque from '../../assets/Icone/not_hide.png';

	let currentStep = 'login';
	let ithide = 'hide';
	let twofa = '';
	let email = '';
	let password = '';
	let username = '';
	let error = '';
	let token = '';
	let loading = false;

	async function addUser() {
		if (!email.trim() || !password.trim() || !username.trim()) {
			error = 'EMPTY_FIELDS';
			return;
		}
		if (!/^[a-zA-Z0-9]{3,24}$/.test(username)) {
		error = 'INVALID_USERNAME';
		return;
	}
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email, username: username, password: password })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			console.log(data);
			email = '';
			password = '';
			username = '';
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			console.log(err);
		}
	}

	async function connectUser() {
		if (!password.trim() || !email.trim()) {
			error = 'EMPTY_FIELDS';
			return;
		}
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email, password: password })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			//console.log(data.accessToken);
			token = data.accessToken;
			console.log(token);
			password = '';
			email = '';
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			if (error === 'TWOFA_CODE_REQUIRED') selectMode('2fa');
		}
	}

	async function connectTwoFa() {
		if (!password.trim() || !email.trim() || !twofa.trim()) {
			error = 'EMPTY_FIELDS';
			return;
		}
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email, password: password, code: twofa })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			console.log(data);
			password = '';
			email = '';
			twofa = '';
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	}

	function translateError(code: string): string {
		const messages: Record<string, string> = {
			INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
			INVALID_USERNAME: "Le nom d'utilisateur doit faire 3 à 24 caractères, lettres et chiffres uniquement",
			INVALID_EMAIL: 'Adresse email invalide',
			INVALID_TWOFA_CODE: 'Code 2FA incorrect',
			USERNAME_OR_EMAIL_ALREADY_TAKEN: "Ce nom d'utilisateur ou cet email est déjà pris",
			WEAK_PASSWORD:
				'Le mot de passe doit contenir 8 caractères min., majuscule, minuscule, chiffre et symbole',
			EMPTY_MESSAGE: 'Le message ne peut pas être vide',
			EMPTY_FIELDS: 'Veuillez remplir tous les champs'
		};
		return messages[code] ?? code;
	}

	function selectMode(mode: string) {
		currentStep = mode;
		error = '';
	}

	function selectModePass(mode: string) {
		ithide = mode;
		error = '';
	}

	async function handleSubmit() {
		if (loading) return;
		loading = true;
		error = '';
		try {
			if (currentStep === 'signin') {
				await addUser();
			} else if (currentStep === 'login') {
				await connectUser();
			} else {
				await connectTwoFa();
			}
		} finally {
			loading = false;
		}
	}
</script>

<main class="relative flex h-screen w-screen items-center justify-center bg-[url('../../assets/Login_background.png')] bg-cover bg-center bg-no-repeat">
	{#if error}
	<p class="absolute top-[470px] left-1/2 -translate-x-1/2 w-[400px] text-center text-red-600 text-base font-semibold z-50">
		{translateError(error)}
	</p>
	{/if}
	<img
		src={logo}
		alt="logo"
		class="absolute top-[100px] left-1/2 -translate-x-1/2 w-[500px] h-auto"
	/>
	<img
		src={strace}
		alt="logo"
		class="absolute top-[450px] left-[calc(50%-140px)] -translate-x-1/2 w-[150px] h-auto -scale-x-100"
	/>
	<img
		src={strace}
		alt="logo"
		class="absolute top-[450px] left-[calc(50%+140px)] -translate-x-1/2 w-[150px] h-auto"
	/>

	{#if currentStep === 'login'}
	<form novalidate on:submit|preventDefault={handleSubmit} class="absolute top-[500px] left-1/2 -translate-x-1/2 w-[550px] h-[600px]">
		<img src={frame} alt="frame" class="absolute inset-0 w-full h-full" />
		<div class="absolute inset-0 flex justify-center top-[75px] text-black" style="font-size: 40px;">
			<p>Connexion</p>
		</div>
		<div class="absolute inset-0 flex justify-center top-[130px] text-black" style="font-size: 15px;">
			<p>Retrouvez votre chemin sur le tatami.</p>
		</div>
		<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
			<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
			<input
				type="email"
				bind:value={email}
				placeholder="Email"
				class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black"
			/>
		</div>
		<div>
			<img src={logomail} alt="logo" class="absolute top-[175px] left-[110px]" />
		</div>
		<div class="relative w-[340px] h-[60px] top-[170px] left-[100px]">
			<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
			<input
				type={ithide === 'hide' ? 'password' : 'text'}
				bind:value={password}
				placeholder="Password"
				class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black"
			/>
		</div>
		<div>
			<img src={logopassword} alt="logo" class="absolute top-[240px] left-[110px]" />
			{#if ithide === 'not hide'}
				<button
					type="button"
					class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
							top-[122px] left-[390px]"
					style="background: transparent !important; box-shadow: none !important;"
					on:click={() => selectModePass('hide')}
				>
					<img src={bloque} alt="description" class="w-[40px] h-[40px] object-contain" />
				</button>
			{:else}
				<button
					type="button"
					class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
							top-[122px] left-[390px]"
					style="background: transparent !important; box-shadow: none !important;"
					on:click={() => selectModePass('not hide')}
				>
					<img src={debloque} alt="description" class="w-[40px] h-[40px] object-contain" />
				</button>
			{/if}
		</div>
		<button
			type="submit"
			class="group absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
				top-[150px] left-[calc(50%-175px)] relative w-[340px] h-[60px]
				flex items-center justify-center"
			style="background: transparent !important; box-shadow: none !important;"
		>
			<img src={cadre} alt="" class="absolute inset-0 w-full h-full object-contain" />
			<span class="relative z-10 text-black text-base font-semibold group-hover:text-white transition-colors">
				Se connecter
			</span>
		</button>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[415px] left-[calc(50%-130px)] -translate-x-1/2 w-[150px] h-[10px] -scale-x-100"
		/>
		<p class="absolute top-[405px] left-[calc(50%-100px)] w-[200px] text-center text-black text-lg font-semibold">
			ou
		</p>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[415px] left-[calc(50%+125px)] -translate-x-1/2 w-[150px] h-[10px]"
		/>
		<button
			type="button"
			class="group absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
				top-[230px] left-[calc(50%-175px)] relative w-[340px] h-[60px]
				flex items-center justify-center"
			style="background: transparent !important; box-shadow: none !important;"
			on:click={() => selectMode('signin')}
		>
			<img src={cadre} alt="" class="absolute inset-0 w-full h-full object-contain" />
			<span class="relative z-10 text-black text-base font-semibold group-hover:text-white transition-colors">
				Creer un compte
			</span>
		</button>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[660px] left-[calc(50%-110px)] -translate-x-1/2 w-[90px] h-auto -scale-x-100"
		/>
		<p class="absolute top-[650px] left-[calc(50%-100px)] w-[200px] text-center text-black text-lg font-semibold">
			onitama
		</p>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[660px] left-[calc(50%+120px)] -translate-x-1/2 w-[90px] h-auto"
		/>
	</form>

	{:else if currentStep === 'signin'}
	<form novalidate on:submit|preventDefault={handleSubmit} class="absolute top-[500px] left-1/2 -translate-x-1/2 w-[550px] h-[600px]">
		<img src={frame} alt="frame" class="absolute inset-0 w-full h-full" />
		<div class="absolute inset-0 flex justify-center top-[75px] text-black" style="font-size: 40px;">
			<p>Creer un compte</p>
		</div>
		<div class="absolute inset-0 flex justify-center top-[130px] text-black" style="font-size: 15px;">
			<p>Retrouvez votre chemin sur le tatami.</p>
		</div>
		<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
			<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
			<input
				type="text"
				placeholder="Username"
				bind:value={username}
				class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black"
			/>
		</div>
		<div>
			<img src={user} alt="logo" class="absolute top-[170px] left-[110px]" />
		</div>
		<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
			<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
			<input
				type="email"
				placeholder="Email"
				bind:value={email}
				class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black"
			/>
		</div>
		<div>
			<img src={logomail} alt="logo" class="absolute top-[235px] left-[110px]" />
		</div>
		<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
			<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
			<input
				type={ithide === 'hide' ? 'password' : 'text'}
				bind:value={password}
				placeholder="Password"
				class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black"
			/>
		</div>
		<div>
			<img src={logopassword} alt="logo" class="absolute top-[292px] left-[110px]" />
			{#if ithide === 'not hide'}
				<button
					type="button"
					class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
							top-[112px] left-[390px]"
					style="background: transparent !important; box-shadow: none !important;"
					on:click={() => selectModePass('hide')}
				>
					<img src={bloque} alt="description" class="w-[40px] h-[40px] object-contain" />
				</button>
			{:else}
				<button
					type="button"
					class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
							top-[112px] left-[390px]"
					style="background: transparent !important; box-shadow: none !important;"
					on:click={() => selectModePass('not hide')}
				>
					<img src={debloque} alt="description" class="w-[40px] h-[40px] object-contain" />
				</button>
			{/if}
		</div>
		<button
			type="submit"
			class="group absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
				top-[130px] left-[calc(50%-175px)] relative w-[340px] h-[60px]
				flex items-center justify-center"
			style="background: transparent !important; box-shadow: none !important;"
		>
			<img src={cadre} alt="" class="absolute inset-0 w-full h-full object-contain" />
			<span class="relative z-10 text-black text-base font-semibold group-hover:text-white transition-colors">
				Creer un compte
			</span>
		</button>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[435px] left-[calc(50%-130px)] -translate-x-1/2 w-[150px] h-[10px] -scale-x-100"
		/>
		<p class="absolute top-[425px] left-[calc(50%-100px)] w-[200px] text-center text-black text-lg font-semibold">
			ou
		</p>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[435px] left-[calc(50%+125px)] -translate-x-1/2 w-[150px] h-[10px]"
		/>
		<button
			type="button"
			class="group absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
				top-[180px] left-[calc(50%-175px)] relative w-[340px] h-[60px]
				flex items-center justify-center"
			style="background: transparent !important; box-shadow: none !important;"
			on:click={() => selectMode('login')}
		>
			<img src={cadre} alt="" class="absolute inset-0 w-full h-full object-contain" />
			<span class="relative z-10 text-black text-base font-semibold group-hover:text-white transition-colors">
				Se connecter
			</span>
		</button>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[660px] left-[calc(50%-110px)] -translate-x-1/2 w-[90px] h-auto -scale-x-100"
		/>
		<p class="absolute top-[650px] left-[calc(50%-100px)] w-[200px] text-center text-black text-lg font-semibold">
			onitama
		</p>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[660px] left-[calc(50%+120px)] -translate-x-1/2 w-[90px] h-auto"
		/>
	</form>

	{:else if currentStep === '2fa'}
	<form novalidate on:submit|preventDefault={handleSubmit} class="absolute top-[500px] left-1/2 -translate-x-1/2 w-[550px] h-[600px]">
		<img src={frame} alt="frame" class="absolute inset-0 w-full h-full" />
		<div class="absolute inset-0 flex justify-center top-[75px] text-black" style="font-size: 40px;">
			<p>2fa validation</p>
		</div>
		<div class="absolute inset-0 flex justify-center top-[130px] text-black" style="font-size: 15px;">
			<p>Retrouvez votre chemin sur le tatami.</p>
		</div>
		<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
			<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
			<input
				type="email"
				placeholder="Email"
				bind:value={email}
				class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black"
			/>
		</div>
		<div>
			<img src={logomail} alt="logo" class="absolute top-[170px] left-[110px]" />
		</div>
		<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
			<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
			<input
				type="text"
				placeholder="code"
				bind:value={twofa}
				class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black"
			/>
		</div>
		<div>
			<img src={logopassword} alt="logo" class="absolute top-[235px] left-[110px]" />
		</div>
		<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
			<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
			<input
				type={ithide === 'hide' ? 'password' : 'text'}
				bind:value={password}
				placeholder="Password"
				class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black"
			/>
		</div>
		<div>
			<img src={logopassword} alt="logo" class="absolute top-[292px] left-[110px]" />
			{#if ithide === 'not hide'}
				<button
					type="button"
					class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
							top-[112px] left-[390px]"
					style="background: transparent !important; box-shadow: none !important;"
					on:click={() => selectModePass('hide')}
				>
					<img src={bloque} alt="description" class="w-[40px] h-[40px] object-contain" />
				</button>
			{:else}
				<button
					type="button"
					class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
							top-[112px] left-[390px]"
					style="background: transparent !important; box-shadow: none !important;"
					on:click={() => selectModePass('not hide')}
				>
					<img src={debloque} alt="description" class="w-[40px] h-[40px] object-contain" />
				</button>
			{/if}
		</div>
		<button
			type="submit"
			class="group absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
				top-[130px] left-[calc(50%-175px)] relative w-[340px] h-[60px]
				flex items-center justify-center"
			style="background: transparent !important; box-shadow: none !important;"
		>
			<img src={cadre} alt="" class="absolute inset-0 w-full h-full object-contain" />
			<span class="relative z-10 text-black text-base font-semibold group-hover:text-white transition-colors">
				Se connecter
			</span>
		</button>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[435px] left-[calc(50%-130px)] -translate-x-1/2 w-[150px] h-[10px] -scale-x-100"
		/>
		<p class="absolute top-[425px] left-[calc(50%-100px)] w-[200px] text-center text-black text-lg font-semibold">
			ou
		</p>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[435px] left-[calc(50%+125px)] -translate-x-1/2 w-[150px] h-[10px]"
		/>
		<button
			type="button"
			class="group absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
				top-[180px] left-[calc(50%-175px)] relative w-[340px] h-[60px]
				flex items-center justify-center"
			style="background: transparent !important; box-shadow: none !important;"
			on:click={() => selectMode('login')}
		>
			<img src={cadre} alt="" class="absolute inset-0 w-full h-full object-contain" />
			<span class="relative z-10 text-black text-base font-semibold group-hover:text-white transition-colors">
				Retour
			</span>
		</button>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[660px] left-[calc(50%-110px)] -translate-x-1/2 w-[90px] h-auto -scale-x-100"
		/>
		<p class="absolute top-[650px] left-[calc(50%-100px)] w-[200px] text-center text-black text-lg font-semibold">
			onitama
		</p>
		<img
			src={strace}
			alt="logo"
			class="absolute top-[660px] left-[calc(50%+120px)] -translate-x-1/2 w-[90px] h-auto"
		/>
	</form>
	{/if}
</main>

<style>
	button {
		color: white;
		background-color: rgba(0, 0, 0, 0.6);
		border: 2px solid transparent;
		border-radius: 50px;
		padding: 1rem 2.5rem;
		font-size: 1.5rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 2px;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		z-index: 10;
		outline: none;
	}

	button:hover {
		background-color: rgba(255, 255, 255, 0.9);
		color: #000;
		transform: scale(1.05);
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
	}
</style>