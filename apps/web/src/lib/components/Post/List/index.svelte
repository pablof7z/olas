<script lang="ts">
    import type { NDKEvent } from '@nostr-dev-kit/ndk';
    import Modal from '../Modal.svelte';
    import Item from './Item.svelte';

    const { events, maxComments = 3 } = $props();

    let openModal = $state(false);
	let selectedEvent = $state<NDKEvent | null>(null);

	function openEvent(event: NDKEvent) {
		selectedEvent = event;
		openModal = true;
	}
</script>

<div class="flex flex-col gap-5">
    {#each events as event (event.id)}
        <div class="mt-5 space-y-5 px-5 md:px-10">
            <button class="text-left w-full" onclick={() => openEvent(event)}>
                <Item {event} class="w-full" containerClass="w-full" {maxComments} />
            </button>
        </div>
    {/each}
</div>

{#if openModal}
	<Modal event={selectedEvent} bind:opened={openModal} />
{/if}
