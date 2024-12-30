<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import Image from '$lib/components/Post/Image.svelte';
    import ndk from '$lib/stores/ndk.svelte';
    import { imetasFromEvent } from '../../../utils/imeta';
    import { page } from '$app/stores';
    import Comment from './Comment.svelte';
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
        { kinds: [1, 1111], "#e": [event.id] },
    ]);

    // Dynamically calculated width
    let modalStyle = $state('');
    let imgStyle = $state('');
    let aspectRatio = $state(1);
    function handleImageLoad(event: Event) {
        const image = event.target as HTMLImageElement;
        aspectRatio = image.naturalWidth / image.naturalHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let imgWidth: number;
        let imgHeight: number;

        if (aspectRatio > 1) {
            imgWidth = Math.min(image.naturalWidth, viewportWidth * 0.9 - 400, image.naturalWidth * 2);
            imgHeight = Math.floor(imgWidth / aspectRatio);
        } else {
            imgHeight = Math.min(image.naturalHeight, viewportHeight * 0.9, image.naturalHeight * 2);
            imgWidth = Math.floor(imgHeight * aspectRatio);
        }

        const maxWidth = imgWidth + 400;
        const maxHeight = Math.min(imgHeight, viewportHeight * 0.9);
        
        modalStyle = `width: ${maxWidth}px !important; max-height: ${maxHeight}px !important;`;
        imgStyle = `width: ${imgWidth}px !important; max-height: ${maxHeight}px !important;`;
    }
</script>

<Dialog.Root bind:open={opened}>
    <Dialog.Content class="p-0 max-w-[90vw] max-h-[90vh] h-full flex" style={modalStyle}>
        <div class="h-full flex flex-col lg:flex-row bg-background rounded-md">
            <!-- Image Container -->
            <div class="flex justify-center items-center flex-1 bg-secondary/10 basis-0 h-full snap-x">
                <Image event={event} 
                    onload={handleImageLoad}
                    style={imgStyle}
                    class="object-cover w-full snap-center h-full flex-none"
                    containerClass="flex flex-row overflow-x-auto snap-x snap-mandatory w-full items-stretch justify-stretch snap-center"
                />
            </div>

            <!-- Comment Section -->
            <div class="overflow-y-auto p-4 text-sm bg-background lg:w-[400px]">
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
