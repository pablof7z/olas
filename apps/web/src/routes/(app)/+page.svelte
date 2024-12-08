<script lang="ts">
	import PostModal from '$lib/components/Post/Modal.svelte';
	import ndk from '$lib/stores/ndk.svelte';
	import { NDKKind, type NDKEvent } from '@nostr-dev-kit/ndk';
	import * as Post from '$lib/components/Post';

	const events = ndk.$subscribe([
		{ kinds: [NDKKind.Image], limit: 100 },
		{ kinds: [1], "#k": ["20"], limit: 100 },
	]);

	let openModal = $state(false);
	let selectedEvent = $state<NDKEvent | null>(null);

	function openEvent(event: NDKEvent) {
		selectedEvent = event;
		openModal = true;
	}
</script>

<div class="flex flex-col gap-5 lg:flex-row">
	<div class="flex-1 lg:flex-shrink-0">
		<div class="mx-auto w-full max-w-[630px]">
			<div class="flex flex-row gap-10 text-lg font-semibold border-b border-gray-200 pb-2">
				<a href="#" class="text-foreground">
					Following
				</a>

				<a href="#" class="text-muted-foreground/30 cursor-not-allowed" title="Not ready yet">
					Communities
				</a>

				<a href="#" class="text-muted-foreground/30 cursor-not-allowed" title="Not ready yet">
					Local
				</a>

			</div>
			
			<!-- <Stories /> -->
			<Post.List {events} />
		</div>
	</div>

	<div class="hidden px-3 text-sm lg:block lg:w-[300px] xl:w-[319px]">
		<!-- <div class="flex items-center gap-3">
			<CircleUser class="size-11" />
			<div>
				<p class="font-medium">teste</p>
				<p class="text-muted-foreground">teste@gmail.com</p>
			</div>
		</div> -->

		<div class="mb-3 mt-8 flex items-center justify-between">
			<p class="text-muted-foreground capitalize">Popular accounts</p>
			<p class="text-xs font-medium">see all</p>
		</div>

		<div class="space-y-4">
			<a href="/negr0@hodl.ar" class="flex items-center gap-3">
				<img src="https://image.nostr.build/de123a0eeb44eace36c872af14d5f82572aab0f54f4933b96336dad644711c2b.jpg" class="size-11 rounded-full" />
				<div>
					<p class="font-medium">negr0</p>
					<p class="text-muted-foreground">negr0@hodl.ar</p>
				</div>
				<button class="ml-auto text-xs text-blue-500">follow</button>
			</a>
			<a href="/derekross@nostrplebs.com" class="flex items-center gap-3">
				<img src="https://i.nostr.build/MVIJ6OOFSUzzjVEc.jpg" class="size-11 rounded-full" />
				<div>
					<p class="font-medium">Derek Ross</p>
					<p class="text-muted-foreground">derekross@nostrplebs.com</p>
				</div>
				<button class="ml-auto text-xs text-blue-500">follow</button>
			</a>
			<a href="/dergigi.com" class="flex items-center gap-3">
				<img src="https://dergigi.com/assets/images/avatars/09.png" class="size-11 rounded-full" />
				<div>
					<p class="font-medium">dergigi</p>
					<p class="text-muted-foreground">dergigi.com</p>
				</div>
				<button class="ml-auto text-xs text-blue-500">follow</button>
			</a>
		</div>
	</div>
</div>

{#if openModal}
	<PostModal event={selectedEvent} bind:opened={openModal} />
{/if}
