<script lang="ts">
    import type { NDKEvent } from '@nostr-dev-kit/ndk';
    import Item from './Item.svelte';
    import Modal from '../Modal.svelte';
    const { events, width = 300 } = $props();
    const imageUrlRegexp = /(?<!\!\[.*?\]\()https?:\/\/[^ ]+\.(jpg|jpeg|png|gif|webp|bmp|svg)(?!\))/;

    let openModal = $state(false);
    let selectedEvent = $state<NDKEvent | null>(null);

    function openEvent(event: NDKEvent) {
        selectedEvent = event;
        openModal = true;
    }
</script>

<div class="grid grid-cols-3 gap-1">
    {#each events as event (event.id)}
        {#if event.content.match(imageUrlRegexp)}
            <button onclick={() => openEvent(event)} class="bg-secondary overflow-clip">
                <Item {event} {width} class="w-full h-full object-cover" containerClass="aspect-square" />
            </button>
        {/if}
    {/each}
</div>

{#if openModal}
    <Modal event={selectedEvent} bind:opened={openModal} />
{/if}
