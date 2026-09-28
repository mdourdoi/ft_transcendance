<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import logo from '../../assets/logo-onitama2.png';
	import frame from '../../assets/frame.png';
	import strace from '../../assets/Icone/strace.png';
	import cadre from '../../assets/bouton_outline.png';
	import logomail from '../../assets/Icone/email.png';
	import logopassword from '../../assets/Icone/Maj.png';
	import bloque from '../../assets/Icone/hide.png';
	import user from '../../assets/Icone/user.png';
	import debloque from '../../assets/Icone/not_hide.png';
	import { Button } from "$lib/components/ui/button/index.js";
	import HelpCircleIcon from "@lucide/svelte/icons/help-circle";
	import InfoIcon from "@lucide/svelte/icons/info";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	let currentStep = '2fa';
	let ithide = 'hide';
	let twofa = '';
	let email = '';
	let password = '';
	let username = '';
	let error = '';
	let loading = false;

	async function addUser() {
	  if (!email.trim() || !password.trim() || !username.trim()) return;
	  try {
		const res = await fetch("http://localhost:3000/auth/register", {
			method: "POST",
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email, username: username, password: password })
		})
		const data = await res.json();
		if (!res.ok) {
			throw new Error(data.message);
		}
		console.log(data)
      	email = '';
      	password = '';
      	username = '';
	   	} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			console.log(err)
		}
		finally {
		loading = false
	  }
	}

	async function connectUser() {
	if (!password.trim() || !username.trim()) return;
	try {
		const res = await fetch("http://localhost:3000/auth/login", {
			method: "POST",
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: username, password: password })
		});
		const data = await res.json();
		if (!res.ok) {
			throw new Error(data.message);
		}
		console.log(data);
		password = '';
		username = '';
	} catch (err) {
		error = err instanceof Error ? err.message : String(err);
		if (error == "TWOFA_CODE_REQUIRED") selectMode('2fa');
	} finally {
		loading = false;
	}
}

function translateError(code: string): string {
	const messages: Record<string, string> = {
		INVALID_CREDENTIALS: "Nom d'utilisateur ou mot de passe incorrect",
		INVALID_TWOFA_CODE: "Code 2FA incorrect",
		USERNAME_OR_EMAIL_ALREADY_TAKEN: "Ce nom d'utilisateur ou cet email est déjà pris",
		WEAK_PASSWORD: "Le mot de passe doit contenir 8 caractères min., majuscule, minuscule, chiffre et symbole",
		EMPTY_MESSAGE: "Le message ne peut pas être vide"
	};
	return messages[code] ?? code;
}

async function twofaTwoFa() {
	if (!password.trim() || !username.trim() || !twofa.trim()) return;
	try {
		const res = await fetch("http://localhost:3000/auth/login", {
			method: "POST",
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: username, password: password , code: twofa})
		});
		const data = await res.json();
		if (!res.ok) {
			throw new Error(data.message);
		}
		console.log(data);
		password = '';
		username = '';
		twofa = '';
	} catch (err) {
		error = err instanceof Error ? err.message : String(err);
		
	} finally {
		loading = false;
	}
	}

	function selectMode(mode: string) {
		currentStep = mode;
		error = '';
		console.log(mode)
	}

	function selectModePass(mode: string) {
		ithide = mode;
		error = '';
	}

	async function handleSubmit() {
		loading = true;
		error = '';
		try {
			if (currentStep === 'sigin') {
				await addUser();
			} else if (currentStep === 'login'){
				await connectUser();
			} else {
				await twofaTwoFa();
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
		<div class="absolute top-[500px] left-1/2 -translate-x-1/2 w-[550px] h-[600px]">
			<img 
				src={frame} 
				alt="frame" 
				class="absolute inset-0 w-full h-full" 
			/>
			<div class="absolute inset-0 flex justify-center top-[75px] text-black" style="font-size: 40px;">
				<p>Connexion</p>
			</div>
			<div class="absolute inset-0 flex justify-center top-[130px] text-black" style="font-size: 15px;">
				<p>Retrouvez votre chemin sur le tatami.</p>
			</div>
			<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
				<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
				<input 
					type="text"
					bind:value={username}
					placeholder="Username"
					class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black" 
				/>
			</div>
			<div>
				<img
					src={user}
					alt="logo"
					class="absolute top-[175px] left-[110px]"
				/>
			</div>
			<div class="relative w-[340px] h-[60px] top-[170px] left-[100px]">
				<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
				<input 
					type={ithide === "hide" ? "password" : "text"}
					bind:value={password}
					placeholder="Password" 
					class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black" 
				/>
			</div>
			<div>
				<img
					src={logopassword}
					alt="logo"
					class="absolute top-[240px] left-[110px]"
				/>
				{#if ithide === "not hide"}
					<button 
						type="button"
						class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
								top-[122px] left-[390px]"
						style="background: transparent !important; box-shadow: none !important;"
						on:click={() => selectModePass("hide")}
					>
						<img src={bloque} alt="description" class="w-[40px] h-[40px] object-contain" />
					</button>
				{:else}
					<button 
						type="button"
						class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
								top-[122px] left-[390px]"
						style="background: transparent !important; box-shadow: none !important;"
						on:click={() => selectModePass("not hide")}
					>
						<img src={debloque} alt="description" class="w-[40px] h-[40px] object-contain" />
					</button>
				{/if}
			</div>
		<button
			type="button"
			class="group absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
				top-[150px] left-[calc(50%-175px)] relative w-[340px] h-[60px]
				flex items-center justify-center"
			style="background: transparent !important; box-shadow: none !important;"
			on:click={() => handleSubmit()}
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
			on:click={() => selectMode('sigin')}
		>
			<img src={cadre} alt="" class="absolute inset-0 w-full h-full object-contain" />
			<span class="relative z-10 text-black text-base font-semibold group-hover:text-white transition-colors">
				Cree un compte
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
	</div>
	{:else if currentStep === 'sigin'}
		<div class="absolute top-[500px] left-1/2 -translate-x-1/2 w-[550px] h-[600px]">
			<img 
				src={frame}
				alt="frame"
				class="absolute inset-0 w-full h-full" 
			/>
			<div class="absolute inset-0 flex justify-center top-[75px] text-black" style="font-size: 40px;">
				<p>Cree un compte</p>
			</div>
			<div class="absolute inset-0 flex justify-center top-[130px] text-black" style="font-size: 15px;">
				<p>Retrouvez votre chemin sur le tatami.</p>
			</div>
			<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
				<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
				<input 
					type="text"
					placeholder="user name"
					bind:value={username}
					class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black" 
				/>
			</div>
			<div>
				<img
					src={user}
					alt="logo"
					class="absolute top-[170px] left-[110px]"
				/>
			</div>
			<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
				<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
				<input 
					type="text"
					placeholder="Email"
					bind:value={email}
					class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black" 
				/>
			</div>
			<div>
				<img
					src={logomail}
					alt="logo"
					class="absolute top-[235px] left-[110px]"
				/>
			</div>
			<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
				<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
				<input 
					type={ithide === "hide" ? "password" : "text"}
					bind:value={password}
					placeholder="Password"
					class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black" 
				/>
			</div>
			<div>
				<img
					src={logopassword}
					alt="logo"
					class="absolute top-[292px] left-[110px]"
				/>
				{#if ithide === "not hide"}
					<button 
						type="button"
						class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
								top-[112px] left-[390px]"
						style="background: transparent !important; box-shadow: none !important;"
						on:click={() => selectModePass("hide")}
					>
						<img src={bloque} alt="description" class="w-[40px] h-[40px] object-contain" />
					</button>
				{:else}
					<button 
						type="button"
						class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
								top-[112px] left-[390px]"
						style="background: transparent !important; box-shadow: none !important;"
						on:click={() => selectModePass("not hide")}
					>
						<img src={debloque} alt="description" class="w-[40px] h-[40px] object-contain" />
					</button>
				{/if}
			</div>
		<button
			type="button"
			class="group absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
				top-[130px] left-[calc(50%-175px)] relative w-[340px] h-[60px]
				flex items-center justify-center"
			style="background: transparent !important; box-shadow: none !important;"
			on:click={() => handleSubmit()}
		>
			<img src={cadre} alt="" class="absolute inset-0 w-full h-full object-contain" />
			<span class="relative z-10 text-black text-base font-semibold group-hover:text-white transition-colors">
				Cree un compte
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
				Ce connecter
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
	</div>
	{:else if currentStep === "2fa"}
		<div class="absolute top-[500px] left-1/2 -translate-x-1/2 w-[550px] h-[600px]">
			<img 
				src={frame}
				alt="frame"
				class="absolute inset-0 w-full h-full" 
			/>
			<div class="absolute inset-0 flex justify-center top-[75px] text-black" style="font-size: 40px;">
				<p>2fa validation</p>
			</div>
			<div class="absolute inset-0 flex justify-center top-[130px] text-black" style="font-size: 15px;">
				<p>Retrouvez votre chemin sur le tatami.</p>
			</div>
			<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
				<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
				<input 
					type="text"
					placeholder="user name"
					bind:value={username}
					class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black" 
				/>
			</div>
			<div>
				<img
					src={user}
					alt="logo"
					class="absolute top-[170px] left-[110px]"
				/>
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
				<img
					src={logopassword}
					alt="logo"
					class="absolute top-[235px] left-[110px]"
				/>
			</div>
			<div class="relative w-[340px] h-[60px] top-[160px] left-[100px]">
				<img src={cadre} alt="cadre" class="absolute inset-0 w-full h-full" />
				<input 
					type={ithide === "hide" ? "password" : "text"}
					bind:value={password}
					placeholder="Password"
					class="absolute inset-0 w-full h-full bg-transparent px-4 text-center outline-none text-black" 
				/>
			</div>
			<div>
				<img
					src={logopassword}
					alt="logo"
					class="absolute top-[292px] left-[110px]"
				/>
				{#if ithide === "not hide"}
					<button 
						type="button"
						class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
								top-[112px] left-[390px]"
						style="background: transparent !important; box-shadow: none !important;"
						on:click={() => selectModePass("hide")}
					>
						<img src={bloque} alt="description" class="w-[40px] h-[40px] object-contain" />
					</button>
				{:else}
					<button 
						type="button"
						class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
								top-[112px] left-[390px]"
						style="background: transparent !important; box-shadow: none !important;"
						on:click={() => selectModePass("not hide")}
					>
						<img src={debloque} alt="description" class="w-[40px] h-[40px] object-contain" />
					</button>
				{/if}
			</div>
		<button
			type="button"
			class="group absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
				top-[130px] left-[calc(50%-175px)] relative w-[340px] h-[60px]
				flex items-center justify-center"
			style="background: transparent !important; box-shadow: none !important;"
			on:click={() => handleSubmit()}
		>
			<img src={cadre} alt="" class="absolute inset-0 w-full h-full object-contain" />
			<span class="relative z-10 text-black text-base font-semibold group-hover:text-white transition-colors">
				se connecter
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
				exit
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
	</div>
	{/if}
</main>