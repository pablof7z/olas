<script lang="ts">
	import { page } from '$app/stores';
	import { currentUser } from '$lib/stores/auth';
	import { logout } from '$lib/services/auth';
	import { goto } from '$app/navigation';

	function handleLogout() {
		logout();
		goto('/login');
	}
</script>

<div class="flex min-h-screen flex-col">
	<!-- Header -->
	<header class="border-border bg-background border-b">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<a href="/dashboard" class="text-xl font-bold">Nostr Wallet</a>

			<nav class="flex items-center space-x-4">
				<a
					href="/dashboard"
					class={$page.url.pathname === '/dashboard'
						? 'text-primary'
						: 'text-foreground hover:text-primary'}
				>
					Dashboard
				</a>
				<a
					href="/send"
					class={$page.url.pathname === '/send'
						? 'text-primary'
						: 'text-foreground hover:text-primary'}
				>
					Send
				</a>
				<a
					href="/deposit"
					class={$page.url.pathname === '/deposit'
						? 'text-primary'
						: 'text-foreground hover:text-primary'}
				>
					Deposit
				</a>
				<a
					href="/transactions"
					class={$page.url.pathname === '/transactions'
						? 'text-primary'
						: 'text-foreground hover:text-primary'}
				>
					Transactions
				</a>
				<button
					on:click={handleLogout}
					class="bg-destructive/10 text-destructive hover:bg-destructive/20 ml-4 rounded-md px-3 py-1"
				>
					Logout
				</button>
			</nav>
		</div>
	</header>

	<!-- Main Content -->
	<main class="flex-1">
		<slot />
	</main>

	<!-- Footer -->
	<footer
		class="border-border bg-background text-muted-foreground border-t py-4 text-center text-sm"
	>
		<p>© {new Date().getFullYear()} Nostr Wallet App</p>
	</footer>
</div>
