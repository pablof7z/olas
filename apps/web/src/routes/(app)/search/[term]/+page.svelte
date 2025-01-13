<script lang="ts">
	import { page } from "$app/stores";
	import ndk from "$lib/stores/ndk.svelte";
	import { NDKEvent, NDKKind, NDKRelaySet } from "@nostr-dev-kit/ndk";
	import PostModal from "$lib/components/Post/Modal.svelte";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
    import * as Post from "$lib/components/Post";

    let {term} = $page.params;
    let searchTerm = $state(term);

    let events = $state<NDKEvent[]>([]);
    let search = $state<NDKEvent[]>([]);

    const performSearch = () => {
        events = ndk.$subscribe([
            { kinds: [NDKKind.Image], "#t": [term]},
            { kinds: [NDKKind.Text], "#t": [term] },
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
            // performSearch();
        }
    }

    $effect(() => {
        console.log('term', term);
        if (term) performSearch();
    });
</script>

<div class="mx-auto max-w-4xl px-2 md:px-4">
    <input
        class="text-xl font-bold focus:outline-none"
        bind:value={searchTerm}
        onkeydown={onKeyDown}
        placeholder="search"
    />

    <Post.Grid events={[...events, ...search]} />
</div>

{#if openModal}
	<PostModal event={selectedEvent} bind:opened={openModal} />
{/if}
