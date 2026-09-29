<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { Stamp } from '$lib/components/onitama';

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
		if (!res.ok) throw new Error("ERROR MAIL USERNAME PASSWORD")
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
			if (!res.ok) throw new Error("ERROR USERNAME OR PASSWORD")
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
		error = '';
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

<main class="relative flex h-screen w-screen items-center justify-center overflow-hidden">
	<img class="pointer-events-none fixed inset-0 size-full select-none" src="../assets/home/background/background.png" alt="" />
	<div class="relative flex flex-col items-center gap-6">
		<img class="h-40 w-auto rounded-xl shadow-lg" src="../assets/home/logo/onitama.png" alt="Onitama" />
		<Card.Root class="w-[340px] border-4 border-double border-border bg-card/90 shadow-xl backdrop-blur-sm">
			{#if currentStep === 'choice'}
				<div in:fade={{ duration: 200 }} class="flex flex-col gap-(--card-spacing)">
					<Card.Header class="items-center text-center">
						<Stamp class="mx-auto mb-2" />
						<Card.Title class="font-display text-2xl">Bienvenue au dojo</Card.Title>
						<Card.Description>Connecte-toi ou rejoins la voie.</Card.Description>
					</Card.Header>
					<Card.Content class="flex flex-col gap-3">
						<Button size="lg" onclick={() => selectMode('login')}>Connexion</Button>
						<Button size="lg" variant="secondary" onclick={() => selectMode('signin')}>Inscription</Button>
					</Card.Content>
				</div>
			{:else}
				<form in:fly={{ y: 20, duration: 300 }} onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex flex-col gap-(--card-spacing)">
					<Card.Header class="text-center">
						<Card.Title class="font-display text-2xl">{currentStep === 'login' ? 'Connexion' : 'Inscription'}</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col gap-3">
						<Input bind:value={username} placeholder="Username" autocomplete="username" required class="h-10 bg-card" />
						{#if currentStep === 'signin'}
							<Input type="email" bind:value={email} placeholder="Email" autocomplete="email" required class="h-10 bg-card" />
						{/if}
						<Input type="password" bind:value={password} placeholder="Mot de passe" autocomplete={currentStep === 'login' ? 'current-password' : 'new-password'} required class="h-10 bg-card" />
						<Button type="submit" size="lg" disabled={loading}>Valider</Button>
						<Button type="button" variant="link" onclick={() => selectMode('choice')}>← Retour</Button>
						{#if error}
							<div in:fly={{ y: -10, duration: 200 }} role="alert" class="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
								<CircleAlert class="size-4 shrink-0" />
								<span>{error}</span>
							</div>
						{/if}
					</Card.Content>
				</form>
			{/if}
		</Card.Root>
	</div>
</main>
