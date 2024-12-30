<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ndk from '$lib/stores/ndk.svelte';
	import { NDKRelaySet } from '@nostr-dev-kit/ndk';

	let { children } = $props();

	// const relaySet = NDKRelaySet.fromRelayUrls(['wss://relay.olas.app'], ndk);
	// const events = ndk.$subscribe([
	// 	{ kinds: [1] },
	// ], { groupable: false, relaySet });
</script>

<div class="">
	<Sidebar />
	<main class="ml-[73px] py-8 md:ml-[244px]">
		{@render children()}
	</main>
</div>
