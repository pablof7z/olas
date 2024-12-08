<script lang="ts">
	import { page } from "$app/stores";
	import ndk from "$lib/stores/ndk.svelte";
	import { NDKEvent, NDKKind, NDKRelaySet } from "@nostr-dev-kit/ndk";
	import Image from "$lib/components/Image/Image.svelte";
	import PostModal from "$lib/components/Post/Modal.svelte";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";

    let {term} = $page.params;
    let searchTerm = $state(term);

    let events = $state<NDKEvent[]>([]);
    const imageUrlRegexp = /(?<!\!\[.*?\]\()https?:\/\/[^ ]+\.(jpg|jpeg|png|gif|webp|bmp|svg)(?!\))/;
    let search = $state<NDKEvent[]>([]);

    const performSearch = () => {
        events = ndk.$subscribe([
            { kinds: [NDKKind.Image], "#t": [term]},
            { kinds: [NDKKind.Text], "#t": [term], limit: 20 },
        ], { groupable: false, relaySet: NDKRelaySet.fromRelayUrls(["wss://relay.olas.app/"], ndk)});

        search = ndk.$subscribe([
            {search: term, kinds: [NDKKind.Text] }
        ], { groupable: false, relaySet: NDKRelaySet.fromRelayUrls(["wss://rselay.nostr.band"], ndk)})
    }

    let openModal = $state(false);
	let selectedEvent = $state<NDKEvent | null>(null);

    function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            term = searchTerm;
            goto(`/search/${term}`, {});
            performSearch();
        }
    }
    
    onMount(() => {
        performSearch();
    })
</script>

<div class="mx-auto max-w-4xl px-4">
    <input
        class="text-xl font-bold focus:outline-none"
        bind:value={searchTerm}
        onkeydown={onKeyDown}
        placeholder="search"
    />

    <div class="grid grid-cols-3 gap-1">
		{#each events as event (event.id)}
            {#if event.content.match(imageUrlRegexp)}
                <button onclick={() => {openModal = true; selectedEvent = event}} class="bg-secondary overflow-clip">
                    {#if event.getMatchingTags("imeta")?.[0]?.[1]}
                        <Image event={event} width={300} class="w-full h-full object-cover" containerClass="aspect-square" />
                    {/if}
                </button>
            {/if}
		{/each}
        {#each search as event (event.id)}
            {#if event.content.match(imageUrlRegexp)}
                <button onclick={() => {openModal = true; selectedEvent = event}} class="bg-secondary overflow-clip">
                    {#if event.getMatchingTags("imeta")?.[0]?.[1]}
                        <Image event={event} width={300} class="w-full h-full object-cover" containerClass="aspect-square" />
                    {/if}
                </button>
            {/if}
		{/each}
	</div>
</div>

{#if openModal}
	<PostModal event={selectedEvent} bind:opened={openModal} />
{/if}
