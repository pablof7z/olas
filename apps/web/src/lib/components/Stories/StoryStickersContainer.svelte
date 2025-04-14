<script lang="ts">
    import { NDKEvent, NDKStory, NDKStoryStickerType } from '@nostr-dev-kit/ndk';
    import { getProxiedImageUrl } from '../../../utils/imgproxy';
    import TextSticker from './TextSticker.svelte';
    
    const { story } = $props<{
        story: NDKStory;
    }>();
    
    const stickers = $derived(story.stickers);
    
    // Helper to extract sticker style from properties
    function getStickerStyle(properties?: Record<string, string>): 'default' | 'gradient1' | 'outline' {
        if (!properties || !properties.style) return 'default';
        
        // Map property style to our supported styles
        const style = properties.style.toLowerCase();
        if (style === 'gradient' || style === 'gradient1') return 'gradient1';
        if (style === 'outline' || style === 'bordered') return 'outline';
        
        return 'default';
    }
</script>

<div class="absolute inset-0 pointer-events-none">
    {#each stickers as sticker}
        <div 
            class="absolute" 
            style="left: {sticker.position.x}%; top: {sticker.position.y}%; width: {sticker.dimension.width}px; height: {sticker.dimension.height}px;"
        >
            {#if sticker.type === NDKStoryStickerType.Text}
                <TextSticker 
                    text={sticker.value}
                    style={getStickerStyle(sticker.properties)}
                />
            {:else if sticker.type === NDKStoryStickerType.Pubkey}
                <div class="w-full h-full flex flex-col items-center justify-center bg-black/30 rounded-full p-1">
                    <div class="w-full h-full rounded-full overflow-hidden">
                        {#if sticker.value?.profile?.image}
                            <img src={getProxiedImageUrl(sticker.value.profile.image, 100)} alt="" class="w-full h-full object-cover" />
                        {:else}
                            <div class="w-full h-full bg-gray-300 flex items-center justify-center">
                                <span class="text-gray-500 text-xs">User</span>
                            </div>
                        {/if}
                    </div>
                    {#if sticker.value?.profile?.name}
                        <span class="text-white text-xs mt-1">{sticker.value.profile.name}</span>
                    {/if}
                </div>
            {:else if sticker.type === NDKStoryStickerType.Event}
                <div class="w-full h-full bg-black/30 rounded-lg p-2">
                    <p class="text-white text-xs">Event Sticker</p>
                </div>
            {:else if sticker.type === NDKStoryStickerType.Prompt}
                <div class="w-full h-full bg-blue-500/50 rounded-lg p-2">
                    <p class="text-white font-medium text-center">{sticker.value}</p>
                </div>
            {:else if sticker.type === NDKStoryStickerType.Countdown}
                <div class="w-full h-full bg-purple-500/50 rounded-lg p-2">
                    <p class="text-white font-medium text-center">{sticker.value}</p>
                </div>
            {/if}
        </div>
    {/each}
</div> 