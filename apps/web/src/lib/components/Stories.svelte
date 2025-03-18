<script lang="ts">
	import { NDKEvent, NDKStory, NDKKind } from '@nostr-dev-kit/ndk';
	import ndk from '$lib/stores/ndk.svelte';
	import StoryAvatar from './Stories/StoryAvatar.svelte';
	import StoryViewer from './Stories/StoryViewer.svelte';
	
	// Fetch stories (kind 25)
	const storyEvents = ndk.$subscribe([
		{ kinds: [25], limit: 20 }
	]);
	
	// Convert events to NDKStory objects
	const stories = $derived(storyEvents.map(event => NDKStory.from(event)));
	
	// Track the currently viewed story
	let currentStoryIndex = $state(-1);
	const currentStory = $derived(
		currentStoryIndex >= 0 && currentStoryIndex < stories.length 
			? stories[currentStoryIndex] 
			: undefined
	);
	
	// Keep track of viewed stories
	let viewedStories = $state(new Set<string>());
	
	function openStory(index: number) {
		currentStoryIndex = index;
		// Mark as viewed
		if (currentStory) {
			viewedStories.add(currentStory.id);
		}
	}
	
	function nextStory() {
		if (currentStoryIndex < stories.length - 1) {
			openStory(currentStoryIndex + 1);
		} else {
			// Close viewer if at the end
			currentStoryIndex = -1;
		}
	}
	
	function prevStory() {
		if (currentStoryIndex > 0) {
			openStory(currentStoryIndex - 1);
		}
	}
</script>

{#if stories.length > 0}
	<div class="mt-4 mb-8">
		<!-- Story avatars/circles -->
		<div class="flex flex-wrap items-center gap-4 py-2 px-2 overflow-x-auto">
			{#each stories as story, i}
				<StoryAvatar 
					{story} 
					seen={viewedStories.has(story.id)}
					onClick={() => openStory(i)} 
				/>
			{/each}
		</div>
		
		<!-- Story viewer modal -->
		{#if currentStory}
			<div class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
				<button 
					class="absolute top-4 right-4 text-white text-2xl z-10"
					on:click={() => currentStoryIndex = -1}
					aria-label="Close"
				>
					&times;
				</button>
				
				<div class="w-full max-w-3xl max-h-[80vh] aspect-[9/16]">
					<StoryViewer 
						story={currentStory} 
						active={true} 
						onNext={nextStory} 
						onPrev={prevStory} 
					/>
				</div>
			</div>
		{/if}
	</div>
{/if}
