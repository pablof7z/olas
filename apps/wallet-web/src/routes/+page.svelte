<script lang="ts">
	import { isAuthenticated } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Redirect on page load
	onMount(() => {
		const unsubscribe = isAuthenticated.subscribe(value => {
			if (value) {
				goto('/dashboard');
			} else {
				goto('/login');
			}
		});
		
		return unsubscribe;
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="text-3xl font-bold">Nostr Wallet</h1>
		<p class="mt-4">Redirecting...</p>
		<div class="mt-6 flex justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
		</div>
	</div>
</div>
