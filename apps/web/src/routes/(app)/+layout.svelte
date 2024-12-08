<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<div class="">
	<Sidebar />
	<main class="ml-[73px] py-8 md:ml-[244px]">
		{@render children()}
	</main>
</div>
