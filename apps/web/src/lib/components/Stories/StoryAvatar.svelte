<script lang="ts">
    import { NDKStory } from '@nostr-dev-kit/ndk';
    import { getProxiedImageUrl } from '../../../utils/imgproxy';

    export let story: NDKStory;
    export let author = story.author;
    export let onClick: () => void = () => {};
    export let seen = false;
    
    // Use author's profile picture as avatar if available
    $: authorPicture = author?.profile?.image;
    
    // Use the first media from the story as preview if no profile picture
    $: previewImageUrl = story.imeta?.url;
    
    // Determine the image to display
    $: imageUrl = authorPicture || previewImageUrl;
    
    // Border color based on whether the story has been seen
    $: borderColor = seen ? 'border-gray-400' : 'border-blue-500';
</script>

<button 
    class="relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden cursor-pointer"
    on:click={onClick}
    aria-label="View story"
>
    <div class={`absolute inset-0 border-2 rounded-full ${borderColor}`}></div>
    {#if imageUrl}
        <img 
            src={getProxiedImageUrl(imageUrl, 100)} 
            alt="" 
            class="w-full h-full object-cover"
        />
    {:else}
        <div class="w-full h-full bg-gray-300 flex items-center justify-center">
            <span class="text-gray-500 text-xs">No image</span>
        </div>
    {/if}
</button> 