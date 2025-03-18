<script lang="ts">
	import ndk from '$lib/stores/ndk.svelte';
	import { NDKEvent, NDKKind, NDKRelaySet } from '@nostr-dev-kit/ndk';
	import * as Post from '$lib/components/Post';
	import { getCurrentUser } from '$lib/stores/currentUser.svelte';
	import { myFollows } from '$lib/myfollows';
	import Stories from '$lib/components/Stories.svelte';

	const events = ndk.$subscribe([
		{ kinds: [NDKKind.Image] },
		{ kinds: [1], "#k": ["20"] },
		// { kinds: [1], authors: Array.from(myFollows), limit: 100 },
	]);

	const relaySet = NDKRelaySet.fromRelayUrls(["wss://relay.olas.app/"], ndk);
	let kind1Events = $state<NDKEvent[] | null>(null);

	const filterEvent = (e: NDKEvent) => (
		e.kind === 20 ||
		(e.kind === 1 && e.tags.some(t => t[0] === 'k' && t[1] === '20')) ||
		(e.kind === 1 && !e.hasTag("e") && e.hasTag("imeta"))
	);
	
	// const filteredEvents = $derived(events.filter(filterEvent));
</script>

<div class="flex flex-col gap-5 lg:flex-row">
	<div class="flex-1 lg:flex-shrink-0">
		<div class="mx-auto w-full max-w-[630px]">
			<div class="flex flex-row text-base gap-0 font-bold">
				<a href="#" class="text-foreground border-b-2 pb-2 px-5 border-foreground hover:border-foreground">
					Following
				</a>

				<a href="#" class="text-muted-foreground/30 cursor-not-allowed border-b-2 pb-2 px-5 border-border" title="Not ready yet">
					Communities
				</a>

				<a href="#" class="text-muted-foreground/30 cursor-not-allowed border-b-2 pb-2 px-5 border-border" title="Not ready yet">
					Local
				</a>

			</div>
			
			<Stories />
			<Post.List events={events} />
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

