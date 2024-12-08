<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import Image from '$lib/components/Image/Image.svelte';
    import ndk from '$lib/stores/ndk.svelte';
    import { imetasFromEvent } from '../../../utils/imeta';
    import { page } from '$app/stores';
    import Comment from '$lib/components/Image/Comment.svelte';
    import { replaceState } from '$app/navigation';
    import { onDestroy } from 'svelte';

    let { event, opened = $bindable() } = $props();

    const imetas = imetasFromEvent(event);
    const urls = imetas.map(imeta => imeta.url);

    let content = event.content;
    for (const url of urls) {
        content = content.replace(url, '');
    }

    let previousUrl = $page.url;

    $effect(() => {
        replaceState(`/e/${event.encode()}`, {});
    });

    onDestroy(() => {
        replaceState(previousUrl, {});
    });

    const comments = ndk.$subscribe([
        { kinds: [1], "#e": [event.id] },
    ]);

    // Dynamically calculated width
    let modalStyle = $state('');
    let imgStyle = $state('');
    let commentSectionStyle = $state('');

    function handleImageLoad(event: Event) {
        const image = event.target as HTMLImageElement;
        const aspectRatio = image.naturalWidth / image.naturalHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const maxWidth = Math.min(image.naturalWidth + 400, viewportWidth * 0.9, image.naturalWidth * 2);

        if (image.naturalWidth < 400) {
            commentSectionStyle = `width: ${image.naturalWidth}px !important;`;
        }
        
        const maxImageHeight = Math.min(image.naturalHeight, viewportHeight * 0.9);

        modalStyle = `width: ${maxWidth}px !important; max-height: ${maxImageHeight}px !important;`;
        imgStyle = `max-height: ${maxImageHeight}px !important;`;
        
        // Adjust the modal width based on the image's aspect ratio
        if (aspectRatio > 1) {
            // Landscape
        } else {
            // Portrait
        }
    }
</script>

<Dialog.Root bind:open={opened}>
    <Dialog.Content class="p-0 max-w-[80vw] max-h-[80vh] h-full flex" style={modalStyle}>
        <div class="h-full flex flex-col lg:flex-row bg-white rounded-md">
            <!-- Image Container -->
            <div class="flex justify-center items-center flex-1 bg-gray-100 basis-0 h-full">
                <Image event={event} 
                    on:load={handleImageLoad}
                    style={imgStyle}
                    class="object-cover"
                />
            </div>

            <!-- Comment Section -->
            <div class="overflow-y-auto p-4 text-sm bg-white lg:w-[400px]">
                <div class="flex flex-col gap-4">
                    <Comment event={event} />

                    {#each comments as comment (comment.id)}
                        <Comment event={comment} />
                    {/each}
                </div>
            </div>
        </div>
    </Dialog.Content>
</Dialog.Root>
