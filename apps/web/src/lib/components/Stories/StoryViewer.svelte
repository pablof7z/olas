<script lang="ts">
	import { NDKStory } from '@nostr-dev-kit/ndk';
	import { getProxiedImageUrl } from '../../../utils/imgproxy';
	import StoryStickersContainer from './StoryStickersContainer.svelte';

	const { story, active = true, onNext = () => {}, onPrev = () => {} } = $props<{
		story: NDKStory;
		active?: boolean;
		onNext?: () => void;
		onPrev?: () => void;
	}>();

	const imeta = $derived(story.imeta);
	const url = $derived(imeta?.url);

	function urlIsVideo(url: string) {
		return /\.(mp4|webm|ogg|m4v|mov|m3u8|ts|qt|)$/i.test(url);
	}

	const isVideo = $derived(imeta?.m?.startsWith('video/') || (url && urlIsVideo(url)));
</script>

<div
	class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-black"
>
	{#if url}
		{#if isVideo}
			<video
				src={url}
				autoplay={active}
				loop
				muted
				playsinline
				class="max-h-full max-w-full object-contain"
			/>
		{:else}
			<img src={getProxiedImageUrl(url, 800)} alt="" class="max-h-full max-w-full object-contain" />
		{/if}
	{/if}

	<!-- Stickers Layer -->
	<StoryStickersContainer {story} />

	<!-- Touch areas for navigation -->
	<div class="absolute inset-0 flex">
		<div class="flex-1" on:click={onPrev} aria-label="Previous story"></div>
		<div class="flex-2" on:click={onNext} aria-label="Next story"></div>
	</div>
</div>
