<script lang="ts">
	import { onMount } from 'svelte';
	import { wallet, balance, isWalletLoading, nutzapMonitor } from '$lib/stores/wallet';
	import { currentUser } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';

	let formattedBalance = '';
	let nutzapEvents = writable<Array<{ id: string; amount?: number; status: string }>>([]);
	let nutzapLoading = writable(false);

	// Format the balance with commas
	$: {
		formattedBalance = $balance.toLocaleString();
	}

	// Update nutzap events when the monitor changes
	$: {
		if ($nutzapMonitor) {
			setupNutzapListeners($nutzapMonitor);
		}
	}

	function setupNutzapListeners(monitor: any) {
		// Listen for nutzap events
		monitor.on('seen', (nutzap: any) => {
			nutzapEvents.update((events) => {
				const exists = events.some((e) => e.id === nutzap.id);
				if (!exists) {
					return [{ id: nutzap.id, status: 'new' }, ...events].slice(0, 5);
				}
				return events;
			});
		});

		monitor.on('redeemed', (events: any[], amount: number) => {
			events.forEach((nutzap) => {
				nutzapEvents.update((evts) => {
					// Update existing event or add new one
					const exists = evts.some((e) => e.id === nutzap.id);
					if (exists) {
						return evts.map((e) => (e.id === nutzap.id ? { ...e, status: 'redeemed', amount } : e));
					} else {
						return [{ id: nutzap.id, status: 'redeemed', amount }, ...evts].slice(0, 5);
					}
				});
			});
		});

		monitor.on('failed', (nutzap: any, error: string) => {
			nutzapEvents.update((events) => {
				const exists = events.some((e) => e.id === nutzap.id);
				if (exists) {
					return events.map((e) => (e.id === nutzap.id ? { ...e, status: 'failed' } : e));
				} else {
					return [{ id: nutzap.id, status: 'failed' }, ...events].slice(0, 5);
				}
			});
		});
	}
</script>

<div class="container mx-auto p-4">
	<div class="mb-8 flex flex-col items-center justify-center">
		<h1 class="text-3xl font-bold">Nostr Wallet</h1>
		{#if $currentUser}
			<p class="text-muted-foreground mt-2">
				Logged in as {$currentUser.npub}
			</p>
		{/if}
	</div>

	<div class="mx-auto max-w-md">
		<!-- Balance Card -->
		<div class="bg-card mb-8 rounded-lg p-6 shadow-md">
			<h2 class="mb-2 text-xl font-semibold">Your Balance</h2>
			<div class="text-4xl font-bold">{formattedBalance} <span class="text-2xl">sats</span></div>
		</div>

		<!-- Actions -->
		<div class="grid grid-cols-2 gap-4">
			<button
				on:click={() => goto('/send')}
				class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-3 text-lg font-medium transition-colors"
			>
				Send
			</button>
			<button
				on:click={() => goto('/deposit')}
				class="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-3 text-lg font-medium transition-colors"
			>
				Deposit
			</button>
		</div>

		<!-- Nutzaps -->
		<div class="mt-8">
			<h2 class="mb-4 text-xl font-semibold">Nutzaps</h2>
			<div class="bg-card rounded-lg p-4 shadow-md">
				{#if $nutzapLoading}
					<div class="mt-4 flex justify-center">
						<div
							class="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
						></div>
					</div>
				{:else if $nutzapEvents.length === 0}
					<p class="text-muted-foreground text-center">No nutzaps received yet</p>
				{:else}
					<ul class="space-y-2">
						{#each $nutzapEvents as event}
							<li class="flex justify-between border-b border-gray-100 pb-2">
								<div class="flex-1 truncate">
									{event.id.substring(0, 8)}...
								</div>
								<div class="flex-1 text-center">
									{#if event.amount}
										{event.amount} sats
									{:else}
										--
									{/if}
								</div>
								<div class="flex-1 text-right">
									{#if event.status === 'redeemed'}
										<span class="text-green-500">Redeemed</span>
									{:else if event.status === 'failed'}
										<span class="text-red-500">Failed</span>
									{:else}
										<span class="text-yellow-500">Processing</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>

		<!-- Recent Transactions -->
		<div class="mt-8">
			<h2 class="mb-4 text-xl font-semibold">Recent Transactions</h2>
			<a
				href="/transactions"
				class="border-border bg-card hover:bg-muted block w-full rounded-md border p-4 text-center transition-colors"
			>
				View All Transactions
			</a>
		</div>
	</div>
</div>
