<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let currentStep = 'choice';
	let email = '';
	let password = '';
	let username = '';
	let error = '';
	let loading = false
	// let loading = true;
	// let error = null;
	// let result = null;
	// let test = null

	// const API_URL = "http://localhost:3000/test";

	// onMount(async () => {
	//     try {
	// 	  const result = await fetch(API_URL);
	// 	  if (!result.ok) throw new Error(`Error fetch api ${res.status}`);
	// 	  test = await result.json();
	// 	  console.log(test)
	// 	} catch (err) {
	// 	  error = err;
	// 	} finally {
	// 	  loading = false;
	// 	}
	// })

	async function addUser() {
	  if (!email.trim() || !password.trim() || !username.trim()) return;
	  try {
		const res = await fetch("http://localhost:3000/auth/register", {
			method: "POST",
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email, username: username, password: password })
		})
		if (!res.ok) throw new Error("Error post api register")
		const createdUser = await res.json();
		console.log(createdUser)
      	email = '';
      	password = '';
      	username = '';
	   	} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
		finally {
		loading = false
	  }
	}

	async function connectUser() {
		if (!password.trim() || !username.trim()) return;
		try{
			const res = await fetch("http://localhost:3000/auth/login", {
				method: "POST",
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({username: username, password: password })
			})
			if (!res.ok) throw new Error("Error post api login")
			const data = await res.json();
			console.log(data);
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
}
		finally {
			loading = false
		}
	}

	function selectMode(mode: string) {
		currentStep = mode;
	}

	async function handleSubmit() {
	loading = true;
	error = '';
	try {
		if (currentStep === 'signin') {
			await addUser();
		} else {
			await connectUser();
		}
	} finally {
		loading = false;
	}
}
</script>

<main>
	<h1>MAIN_TITLE</h1>
	<div class="card-container">
		{#if currentStep === 'choice'}
			<div in:fade={{ duration: 200 }} class="button-group">
				<button class="btn primary" on:click={() => selectMode('login')}>
					Connexion
				</button>
				<button class="btn secondary" on:click={() => selectMode('signin')}>
					Inscription
				</button>
			</div>
		{:else if currentStep === 'login'}
			<form
				in:fly={{ y: 20, duration: 300 }}
				on:submit|preventDefault={handleSubmit}
				class="form-card"
			>
				<h2>{currentStep === 'login' ? 'Connexion' : 'Inscription'}</h2>
				<div class="input-group">
					<input type="username" bind:value={username} placeholder="Username" required />
					<input type="password" bind:value={password} placeholder="Mot de passe" required />
				</div>
				<button type="submit" class="btn primary">Valider</button>
				<button type="button" class="btn-link" on:click={() => selectMode('choice')}>
					← Retour
				</button>
			</form>
		{:else}
			<form
				in:fly={{ y: 20, duration: 300 }}
				on:submit|preventDefault={handleSubmit}
				class="form-card">
				<h2>{currentStep === 'login' ? 'Connexion' : 'Inscription'}</h2>
				<div class="input-group">
					<input type="username" bind:value={username} placeholder="Username" required/>
					<input type="email" bind:value={email} placeholder="Email" required/>
					<input type="password" bind:value={password} placeholder="Mot de passe" required/>
				</div>
				<button type="submit" class="btn primary">Valider</button>
				<button type="button" class="btn-link" on:click={() => selectMode('choice')}>
					← Retour
				</button>
			</form>
		{/if}
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		height: 100vh;
		overflow: hidden;
		font-family: system-ui, -apple-system, sans-serif;
	}

	main {
		background-image: url('../assets/home-page.jpg');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		width: 100vw;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
	}

	h1 {
		color: white;
		margin: 0;
		position: absolute;
		top: 40px;
		font-size: 2.5rem;
		letter-spacing: 2px;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
	}

	.card-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.button-group, .form-card {
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 16px;
		padding: 2.5rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
		width: 300px;
	}

	h2 {
		margin: 0 0 0.5rem 0;
		color: white;
		text-align: center;
		font-size: 1.5rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	input {
		width: 100%;
		padding: 12px 14px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.85);
		font-size: 0.95rem;
		box-sizing: border-box;
		outline: none;
		transition: all 0.2s ease;
		color: black;
	}

	input:focus {
		background: #ffffff;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
	}

	.btn {
		padding: 12px;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.1s ease, background-color 0.2s ease;
	}

	.btn:hover {
		transform: translateY(-2px);
	}

	.btn:active {
		transform: translateY(0);
	}

	.btn.primary {
		background-color: #6366f1;
		color: white;
	}

	.btn.primary:hover {
		background-color: #4f46e5;
	}

	.btn.secondary {
		background-color: rgba(255, 255, 255, 0.9);
		color: #1f2937;
	}

	.btn.secondary:hover {
		background-color: #ffffff;
	}

	.btn-link {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		font-size: 0.85rem;
		margin-top: 0.2rem;
	}

	.btn-link:hover {
		color: white;
		text-decoration: underline;
	}
</style>

