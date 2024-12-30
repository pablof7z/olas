<script lang="ts">
    import type { NDKEvent } from '@nostr-dev-kit/ndk';
    import Modal from '../Modal.svelte';
    import Item from './Item.svelte';
    import Lazy from "svelte-lazy";

    const { events, maxComments = 3 } = $props();

    let maxSeen = $state(30);

    let openModal = $state(false);
	let selectedEvent = $state<NDKEvent | null>(null);

	function openEvent(event: NDKEvent) {
		selectedEvent = event;
		openModal = true;
	}
</script>

<div class="flex flex-col gap-5">
    {#each events.slice(0, maxSeen) as event (event.id)}
        <div class="mt-5 space-y-5 px-5 md:px-10">
            <Item {event} class="w-full" containerClass="w-full" {maxComments} onclick={() => openEvent(event)} />
        </div>
    {/each}
    {#if events.length > maxSeen}
        <Lazy onload={() => maxSeen += 30}>
            <button class="text-muted-foreground/30 cursor-not-allowed border-b-2 pb-2 px-5 border-border" title="Not ready yet">
                Load more
            </button>
        </Lazy>
    {/if}
</div>

{#if openModal}
	<Modal event={selectedEvent} bind:opened={openModal} />
{/if}
