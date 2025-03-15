<script lang="ts">
	import { loginWithNip07, loginWithPrivateKey, createNewAccount, updateProfileName, autoLogin } from '$lib/services/auth';
	import { initializeWallet } from '$lib/services/wallet';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/stores/auth';

	let errorMessage = $state('');
	let loginMethod = $state('extension'); // 'extension' or 'privateKey'
	let nsecKey = $state('');
	let showPrivateKey = $state(false);
	let activeTab = $state('login'); // 'login' or 'create'
	let newAccountName = $state('');
	let createdNsec = $state('');
	let isProcessing = $state(false); // Only used for button UI feedback

	async function checkAutoLogin() {
		try {
			// Only run auto-login if we're not already logged in
			if (!$currentUser) {
				isProcessing = true;
				const result = await autoLogin();
				
				if (result) {
					const { ndk } = result;
					await initializeWallet(ndk);
					goto('/dashboard');
				} else {
					// Check if browser has window.nostr object
					if (typeof window !== 'undefined' && 'nostr' in window && loginMethod === 'extension') {
						console.log('NIP-07 extension detected');
					} else if (loginMethod === 'extension') {
						errorMessage = 'No NIP-07 extension detected. Please install Alby, nos2x, or another NIP-07 compatible extension.';
					}
				}
			} else {
				// If user is already logged in, redirect to dashboard
				goto('/dashboard');
			}
		} catch (error) {
			console.error('Auto-login failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Auto-login failed';
		} finally {
			isProcessing = false;
		}
	}

	$effect(() => {
		checkAutoLogin();
	});

	async function handleLogin() {
		isProcessing = true;
		errorMessage = '';

		try {
			let result;
			
			if (loginMethod === 'extension') {
				result = await loginWithNip07();
			} else {
				if (!nsecKey) {
					throw new Error('Please enter your private key');
				}
				result = await loginWithPrivateKey(nsecKey);
			}
			
			const { ndk } = result;
			initializeWallet(ndk);
			goto('/dashboard');
		} catch (error) {
			console.error('Login failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials and try again.';
		} finally {
			isProcessing = false;
		}
	}

	async function handleCreateAccount() {
		isProcessing = true;
		errorMessage = '';

		try {
			// Create new account
			const { nsec, npub, ndk } = await createNewAccount();
			createdNsec = nsec;
			
			// Update profile name if provided
			if (newAccountName) {
				updateProfileName(newAccountName);
			}
			
			initializeWallet(ndk);
			
			// Go to dashboard
			goto('/dashboard');
		} catch (error) {
			console.error('Account creation failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
		} finally {
			isProcessing = false;
		}
	}

	function toggleLoginMethod() {
		loginMethod = loginMethod === 'extension' ? 'privateKey' : 'extension';
		errorMessage = '';
	}

	/**
	 * Switch between login tabs
	 */
	function switchTab(tab: 'login' | 'create') {
		activeTab = tab;
		errorMessage = '';
	}
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md space-y-8 p-4">
		<div class="text-center">
			<h1 class="text-4xl font-bold">Nostr Wallet</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">Your gateway to the Nostr economy</p>
		</div>

		<!-- Tab Navigation -->
		<div class="flex justify-center space-x-4 border-b border-gray-200 pb-4">
			<button
				class={`px-4 py-2 font-medium ${
					activeTab === 'login'
						? 'border-b-2 border-primary text-primary'
						: 'text-gray-500 hover:text-gray-700'
				}`}
				on:click={() => switchTab('login')}
			>
				Login
			</button>
			<button
				class={`px-4 py-2 font-medium ${
					activeTab === 'create'
						? 'border-b-2 border-primary text-primary'
						: 'text-gray-500 hover:text-gray-700'
				}`}
				on:click={() => switchTab('create')}
			>
				Create Account
			</button>
		</div>

		{#if !$currentUser}
			{#if activeTab === 'login'}
				<div class="mt-8 space-y-6">
					<!-- Login Method Toggle -->
					<div class="flex justify-center space-x-4">
						<button
							class={`px-4 py-2 rounded-md ${
								loginMethod === 'extension'
									? 'bg-primary text-primary-foreground'
									: 'bg-secondary text-secondary-foreground'
							}`}
							on:click={() => (loginMethod = 'extension')}
						>
							Browser Extension
						</button>
						<button
							class={`px-4 py-2 rounded-md ${
								loginMethod === 'privateKey'
									? 'bg-primary text-primary-foreground'
									: 'bg-secondary text-secondary-foreground'
							}`}
							on:click={() => (loginMethod = 'privateKey')}
						>
							Private Key
						</button>
					</div>

					{#if loginMethod === 'privateKey'}
						<!-- Private Key Input -->
						<div class="space-y-2">
							<div class="relative">
								<input
									type={showPrivateKey ? 'text' : 'password'}
									bind:value={nsecKey}
									placeholder="Enter your nsec private key"
									class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								/>
								<button
									type="button"
									class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
									on:click={() => (showPrivateKey = !showPrivateKey)}
								>
									{showPrivateKey ? 'Hide' : 'Show'}
								</button>
							</div>
							<p class="text-xs text-muted-foreground">
								Warning: Entering your private key can be risky. Only use this method on a trusted device.
							</p>
						</div>
					{/if}

					<!-- Login Button -->
					<button
						on:click={handleLogin}
						disabled={isProcessing}
						class="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isProcessing}
							Loading...
						{:else}
							{loginMethod === 'extension' ? 'Connect with Extension' : 'Login with Private Key'}
						{/if}
					</button>

					<!-- Help Text -->
					{#if loginMethod === 'extension'}
						<div class="mt-6 text-center text-sm">
							<p>
								Don't have a Nostr extension?
								<a
									href="https://getalby.com/"
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary underline"
								>
									Get Alby
								</a>
								or
								<a
									href="https://github.com/fiatjaf/nos2x"
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary underline"
								>
									Get nos2x
								</a>
								or
								<button class="text-primary underline" on:click={toggleLoginMethod}>
									use a private key
								</button>
							</p>
						</div>
					{:else}
						<div class="mt-6 text-center text-sm">
							<p>
								Have a Nostr browser extension?
								<button class="text-primary underline" on:click={toggleLoginMethod}>
									Login with extension instead
								</button>
							</p>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Create Account Form -->
				<div class="mt-8 space-y-6">
					<div class="space-y-4">
						<div class="space-y-2">
							<label for="name" class="text-sm font-medium">Display Name (optional)</label>
							<input
								id="name"
								type="text"
								bind:value={newAccountName}
								placeholder="Enter your name"
								class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>

						<button
							on:click={handleCreateAccount}
							disabled={isProcessing}
							class="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if isProcessing}
								Creating Account...
							{:else}
								Create New Account
							{/if}
						</button>

						<p class="text-xs text-muted-foreground">
							Creating a new account will generate a private key for you. Make sure to back it up securely.
						</p>
					</div>
				</div>
			{/if}
		{:else}
			<!-- Already logged in, redirecting -->
			<div class="mt-8 space-y-6 text-center">
				<p>You are already logged in. Redirecting to dashboard...</p>
			</div>
		{/if}

		<!-- Error Message -->
		{#if errorMessage}
			<div class="mt-4 rounded-md bg-destructive/10 p-3 text-destructive">
				{errorMessage}
			</div>
		{/if}

		<!-- Account Successfully Created Message -->
		{#if createdNsec}
			<div class="mt-4 rounded-md bg-green-100 p-3 text-green-800 dark:bg-green-900 dark:text-green-200">
				<p class="font-bold">Account created successfully!</p>
				<p class="mt-2 text-sm">Your private key is:</p>
				<div class="mt-1 overflow-x-auto rounded bg-black/10 p-2 dark:bg-white/10">
					<code class="text-xs">{createdNsec}</code>
				</div>
				<p class="mt-2 text-xs font-medium">
					IMPORTANT: Save this private key somewhere safe. It will not be shown again.
				</p>
			</div>
		{/if}
	</div>
</div>
