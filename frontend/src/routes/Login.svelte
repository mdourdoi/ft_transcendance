<script lang="ts">
	import logo from '../../assets/logo-onitama2.webp';
	import strace from '../../assets/Icone/strace.webp';
	import logomail from '../../assets/Icone/email.png';
	import logopassword from '../../assets/Icone/Maj.png';
	import user from '../../assets/Icone/user.png';
	import { AuthButton, AuthDivider, AuthField, AuthForm, PasswordToggle } from '$lib/components/auth';
	import '$lib/components/auth/auth.css';
	import { navigate } from '$lib/router';
	import { token } from '$lib/auth';
	import { t } from '$lib/i18n';
	import { profilManager } from '$lib/stores/profil.svelte';

	type Step = 'login' | 'signin' | '2fa';

	let currentStep = $state<Step>('login');
	let hidden = $state(true);
	let twofa = $state('');
	let email = $state('');
	let password2 = $state('');
	let password = $state('');
	let username = $state('');
	let error = $state('');
	let loading = false;
	let acceptTerms = $state(false);
	let notice = $state('');

	const passwordType = $derived(hidden ? 'password' : 'text');

	async function post(path: string, body: Record<string, string | boolean>) {
		try {
			const res = await fetch(path, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const data = await res.json();
			if (!res.ok) {
				error = Array.isArray(data.message) ? data.message[0] : data.message ?? 'UNKNOWN_ERROR';
				return null;
			}
			return data;
		} catch {
			error = 'NETWORK_ERROR';
			return null;
		}
	}

	function enter(accessToken: string) {
		password = '';
		email = '';
		twofa = '';
		token.set(accessToken);
		navigate(`/home`, { useAnimation: true });
	}

	async function addUser() {
		if (!email.trim() || !password.trim() || !username.trim() || !password2.trim()) {
			error = 'EMPTY_FIELDS';
			return;
		}
		if (password !== password2) {
            error = 'NOTE_SAME_PASSWORD';
            return;
        }
		if (!/^[a-zA-Z0-9]{3,24}$/.test(username)) {
			error = 'INVALID_USERNAME';
			return;
		}
		if (!acceptTerms) {
			error = 'CONSENT_REQUIRED';
			return;
		}
		if (await post('/api/auth/register', { email, username, password, acceptTerms: true }))
			selectMode('login');
	}

	async function connectUser() {
		if (!password.trim() || !email.trim()) {
			error = 'EMPTY_FIELDS';
			return;
		}
		const data = await post('/api/auth/login', { email, password });
		if (data)
			enter(data.accessToken);
		else if (error === 'TWOFA_CODE_REQUIRED' || error === 'MAIL_RATE_LIMITED')
			selectMode('2fa');
	}

	async function connectTwoFa() {
		const code = twofa.trim();
		if (!password.trim() || !email.trim() || !code) {
			error = 'EMPTY_FIELDS';
			return;
		}
		const data = await post('/api/auth/login', { email: email.trim(), password: password.trim(), code });
		if (!data)
			return;
		profilManager.able_two_fa();
		enter(data.accessToken);
	}

	async function resendCode() {
		if (loading) return;
		loading = true;
		error = '';
		notice = '';
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), password: password.trim() })
			});
			const data = await res.json();
			const errorCode = Array.isArray(data.message) ? data.message[0] : data.message ?? 'UNKNOWN_ERROR';
			if (errorCode === 'TWOFA_CODE_REQUIRED') notice = 'TWOFA.RESENT';
			else error = errorCode;
		} catch {
			error = 'NETWORK_ERROR';
		} finally {
			loading = false;
		}
	}

	function selectMode(mode: Step) {
		currentStep = mode;
		error = '';
		notice = '';
	}

	async function handleSubmit() {
		if (loading) return;
		loading = true;
		error = '';
		notice = '';
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

<main class="auth-screen relative flex h-screen w-screen items-center justify-center bg-[url('../../assets/Login_background.webp')] bg-cover bg-center bg-no-repeat">
	{#if error}
	<p class="absolute top-[470px] left-1/2 -translate-x-1/2 w-[400px] text-center text-red-600 text-base font-semibold z-50">
		{$t(`ERRORS.${error}`, { default: $t('ERRORS.UNKNOWN_ERROR') })}
	</p>
	{:else if notice}
	<p class="absolute top-[470px] left-1/2 -translate-x-1/2 w-[400px] text-center text-black text-base font-semibold z-50">
		{$t(notice)}
	</p>
	{/if}
	<img
		src={logo}
		alt="Onitama"
		class="absolute top-[100px] left-1/2 -translate-x-1/2 w-[500px] h-auto"
	/>
	<img
		src={strace}
		alt=""
		class="absolute top-[450px] left-[calc(50%-140px)] -translate-x-1/2 w-[150px] h-auto -scale-x-100"
	/>
	<img
		src={strace}
		alt=""
		class="absolute top-[450px] left-[calc(50%+140px)] -translate-x-1/2 w-[150px] h-auto"
	/>

	{#if currentStep === 'login'}
	<AuthForm title={$t('AUTH.LOGIN_TITLE')} onsubmit={handleSubmit}>
		<AuthField type="email" bind:value={email} placeholder={$t('AUTH.EMAIL')} icon={logomail} class="top-[160px]" iconClass="top-[175px]" />
		<AuthField type={passwordType} bind:value={password} placeholder={$t('AUTH.PASSWORD')} icon={logopassword} class="top-[170px]" iconClass="top-[240px]">
			<PasswordToggle bind:hidden class="top-[122px]" ontoggle={() => (error = '')} />
		</AuthField>
		<AuthButton type="submit" class="top-[150px]">{$t('AUTH.LOGIN')}</AuthButton>
		<AuthDivider lineClass="top-[415px]" textClass="top-[405px]" />
		<AuthButton class="top-[230px]" onclick={() => selectMode('signin')}>{$t('AUTH.REGISTER')}</AuthButton>
	</AuthForm>

	{:else if currentStep === 'signin'}
<AuthForm title={$t('AUTH.REGISTER_TITLE')} onsubmit={handleSubmit}>
	<AuthField bind:value={username} placeholder={$t('AUTH.USERNAME')} icon={user} class="top-[160px]" iconClass="top-[170px]" />
	<AuthField type="email" bind:value={email} placeholder={$t('AUTH.EMAIL')} icon={logomail} class="top-[160px]" iconClass="top-[231px]" />
	<AuthField type={passwordType} bind:value={password} placeholder={$t('AUTH.PASSWORD')} icon={logopassword} class="top-[160px]" iconClass="top-[292px]">
		<PasswordToggle bind:hidden class="top-[112px]" ontoggle={() => (error = '')} />
	</AuthField>
	<AuthField type={passwordType} bind:value={password2} placeholder={$t('AUTH.PASSWORD')} icon={logopassword} class="top-[115px]" iconClass="top-[352px]">
		<PasswordToggle bind:hidden class="top-[65px]" ontoggle={() => (error = '')} />
	</AuthField>
	<AuthButton type="submit" class="top-[110px]" disabled={!acceptTerms}>{$t('AUTH.REGISTER')}</AuthButton>
	<AuthDivider lineClass="top-[515px]" textClass="top-[505px]" />
	<AuthButton class="top-[140px]" onclick={() => selectMode('login')}>{$t('AUTH.LOGIN')}</AuthButton>
	<div class="absolute top-[402px] left-[calc(50%-170px)] w-[340px] flex flex-col items-center text-black text-xs">
		<label class="flex items-start gap-2 text-left">
			<input type="checkbox" bind:checked={acceptTerms} class="mt-0.5 accent-black" />
			<span>{$t('REGISTER.ACCEPT_TERMS')}</span>
		</label>
		<p>
			<a href="/privacy-policy" target="_blank" rel="noopener" class="underline">{$t('POLICY.TITLE')}</a>
			·
			<a href="/terms" target="_blank" rel="noopener" class="underline">{$t('TERMS.TITLE')}</a>
		</p>
	</div>
</AuthForm>

	{:else}
	<AuthForm title={$t('AUTH.TWOFA_TITLE')} hint={$t('TWOFA.HINT')} onsubmit={handleSubmit}>
		<AuthField bind:value={twofa} placeholder={$t('AUTH.CODE')} icon={logopassword} class="top-[160px]" iconClass="top-[170px]" />
		<AuthField type="email" bind:value={email} placeholder={$t('AUTH.EMAIL')} icon={logomail} class="top-[160px]" iconClass="top-[235px]" />
		<AuthField type={passwordType} bind:value={password} placeholder={$t('AUTH.PASSWORD')} icon={logopassword} class="top-[160px]" iconClass="top-[292px]">
			<PasswordToggle bind:hidden class="top-[112px]" ontoggle={() => (error = '')} />
		</AuthField>
		<AuthButton type="submit" class="top-[130px]">{$t('AUTH.LOGIN')}</AuthButton>
		<AuthDivider lineClass="top-[435px]" textClass="top-[425px]" />
		<AuthButton class="top-[180px]" onclick={() => selectMode('login')}>{$t('COMMON.BACK')}</AuthButton>
		<button
			type="button"
			class="absolute !bg-transparent !border-none !p-0 !shadow-none !outline-none hover:!bg-transparent hover:!scale-100
				top-[178px] left-[calc(50%-170px)] relative w-[340px] !text-sm !normal-case !tracking-normal !text-black underline"
			style="background: transparent !important; box-shadow: none !important;"
			onclick={resendCode}
		>
			{$t('TWOFA.RESEND')}
		</button>
	</AuthForm>
	{/if}
</main>
