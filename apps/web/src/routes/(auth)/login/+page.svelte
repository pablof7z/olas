<script lang="ts">
	import Logo from '$lib/components/icons/Logo.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Loader, Eye, EyeOff } from 'lucide-svelte';
	import { loginWithNip07, loginWithPrivateKey, createNewAccount, autoLogin } from '$lib/services/auth';
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';
	import { goto } from '$app/navigation';

	// State variables
	let isProcessing = $state(false);
	let errorMessage = $state('');
	let activeTab = $state('login');
	let loginMethod = $state('extension');
	let nsecKey = $state('');
	let showPrivateKey = $state(false);
	let newAccountName = $state('');
	let createdNsec = $state('');
	let createdNpub = $state('');
	let showCreatedKeys = $state(false);

	// Check for auto-login on mount
	onMount(async () => {
		if ($currentUser) {
			goto('/'); // Redirect if already logged in
			return;
		}
		
		try {
			isProcessing = true;
			const result = await autoLogin();
			
			if (result) {
				goto('/');
			} else if (loginMethod === 'extension' && typeof window !== 'undefined' && !('nostr' in window)) {
				errorMessage = 'No NIP-07 extension detected. Please install Alby, nos2x, or another NIP-07 compatible extension.';
			}
		} catch (error) {
			console.error('Auto-login failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Auto-login failed';
		} finally {
			isProcessing = false;
		}
	});

	// Handle login with extension or private key
	async function handleLogin() {
		errorMessage = '';
		isProcessing = true;
		
		try {
			if (loginMethod === 'extension') {
				await loginWithNip07();
			} else {
				if (!nsecKey) {
					throw new Error('Please enter your private key');
				}
				await loginWithPrivateKey(nsecKey);
			}
			
			goto('/');
		} catch (error) {
			console.error('Login failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials and try again.';
		} finally {
			isProcessing = false;
		}
	}

	// Handle account creation
	async function handleCreateAccount() {
		errorMessage = '';
		isProcessing = true;
		
		try {
			const { nsec, npub } = await createNewAccount();
			createdNsec = nsec;
			createdNpub = npub;
			showCreatedKeys = true;
			
			// Redirect after showing keys
			setTimeout(() => {
				goto('/');
			}, 10000);
		} catch (error) {
			console.error('Account creation failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
		} finally {
			isProcessing = false;
		}
	}

	// Toggle which tab is active
	function switchTab(tab: string) {
		activeTab = tab;
		errorMessage = '';
	}

	// Toggle showing the private key
	function togglePrivateKeyVisibility() {
		showPrivateKey = !showPrivateKey;
	}

	// Toggle showing the created keys
	function toggleCreatedKeysVisibility() {
		showCreatedKeys = !showCreatedKeys;
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center px-4 py-12">
	<Card.Root class="mx-auto w-full max-w-md">
		<Card.Header>
			<div class="mx-auto w-fit mb-4">
				<Logo />
			</div>
			<Tabs.Root value={activeTab} class="w-full">
				<Tabs.List class="grid grid-cols-2">
					<Tabs.Trigger value="login" on:click={() => switchTab('login')}>Login</Tabs.Trigger>
					<Tabs.Trigger value="create" on:click={() => switchTab('create')}>Create Account</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		</Card.Header>
		
		<Card.Content>
			{#if errorMessage}
				<div class="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md">
					{errorMessage}
				</div>
			{/if}
			
			{#if activeTab === 'login'}
				<div class="space-y-4">
					<!-- Login Method Toggle -->
					<div class="flex space-x-2">
						<Button
							type="button"
							variant={loginMethod === 'extension' ? 'default' : 'outline'}
							class="flex-1"
							on:click={() => (loginMethod = 'extension')}
						>
							Browser Extension
						</Button>
						<Button
							type="button"
							variant={loginMethod === 'privateKey' ? 'default' : 'outline'}
							class="flex-1"
							on:click={() => (loginMethod = 'privateKey')}
						>
							Private Key
						</Button>
					</div>
					
					{#if loginMethod === 'privateKey'}
						<div class="space-y-2">
							<div class="relative">
								<Input
									type={showPrivateKey ? 'text' : 'password'}
									placeholder="Enter your nsec private key"
									bind:value={nsecKey}
								/>
								<button
									type="button"
									class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
									on:click={togglePrivateKeyVisibility}
								>
									{#if showPrivateKey}
										<EyeOff class="size-4" />
									{:else}
										<Eye class="size-4" />
									{/if}
								</button>
							</div>
							<p class="text-xs text-muted-foreground">
								Warning: Entering your private key can be risky. Only use this method on a trusted device.
							</p>
						</div>
					{:else}
						<p class="text-sm text-center">
							Login with your Nostr extension to access your account.
						</p>
					{/if}
					
					<Button
						type="button"
						class="w-full"
						disabled={isProcessing}
						on:click={handleLogin}
					>
						{#if isProcessing}
							<Loader class="mr-2 size-4 animate-spin" />
							Loading...
						{:else}
							{loginMethod === 'extension' ? 'Connect with Extension' : 'Login with Private Key'}
						{/if}
					</Button>
					
					{#if loginMethod === 'extension'}
						<div class="text-center text-sm">
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
							</p>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'create'}
				<div class="space-y-4">
					{#if createdNsec && createdNpub}
						<div class="space-y-3 p-3 border rounded-md bg-green-50">
							<h3 class="font-medium text-green-800">Account created successfully!</h3>
							<p class="text-sm text-green-700">Save these details securely. They will not be shown again.</p>
							
							<div class="space-y-2">
								<label class="text-xs font-medium">Your Public Key (npub)</label>
								<div class="bg-white p-2 rounded border text-sm break-all">
									{createdNpub}
								</div>
							</div>
							
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<label class="text-xs font-medium">Your Private Key (nsec)</label>
									<button
										type="button"
										class="text-xs text-primary"
										on:click={toggleCreatedKeysVisibility}
									>
										{showCreatedKeys ? 'Hide' : 'Show'}
									</button>
								</div>
								<div class="bg-white p-2 rounded border text-sm break-all">
									{#if showCreatedKeys}
										{createdNsec}
									{:else}
										••••••••••••••••••••••••••••••••••••
									{/if}
								</div>
							</div>
							
							<p class="text-xs text-red-600 font-medium">
								IMPORTANT: Save your private key somewhere safe. This is the only way to access your account.
							</p>
						</div>
					{:else}
						<div class="space-y-2">
							<p class="text-sm">
								Create a new Nostr account with a generated private key. No email needed.
							</p>
							<Button
								type="button"
								class="w-full"
								disabled={isProcessing}
								on:click={handleCreateAccount}
							>
								{#if isProcessing}
									<Loader class="mr-2 size-4 animate-spin" />
									Creating Account...
								{:else}
									Generate New Account
								{/if}
							</Button>
						</div>
					{/if}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
