<script lang="ts">
	import { Bookmark, CircleUser, Ellipsis, Heart, MessageCircle, Send } from 'lucide-svelte';
	import { Separator } from '$lib/components/ui/separator';
	import Lazy from "svelte-lazy";
	import { NDKKind, type NDKEvent, type NDKUserProfile } from '@nostr-dev-kit/ndk';
    import Image from '../Image.svelte';
	import ndk from '$lib/stores/ndk.svelte';
	import NewComment from '../NewComment.svelte';
	import Comment from '../Comment.svelte';
	import { getCurrentUser } from '$lib/stores/currentUser.svelte';
	import React from '$lib/components/buttons/React.svelte';

	const {
		event,
		class: className,
		onclick,
		maxComments = 3
	} = $props() as { event: NDKEvent, class: string, onclick: () => void, maxComments: number };

	const clientName = event.tagValue('client');

	let userProfile = $state<NDKUserProfile | null>(null);
	event.author.fetchProfile().then(profile => userProfile = profile);

	const relatedEvents = ndk.$subscribe([
		{ kinds: [NDKKind.GenericReply], "#E": [event.id] },
		{ "#e": [event.id] },
	])

	const isTopLevelComment = (e: NDKEvent) => {
		if (e.kind === NDKKind.GenericReply) {
			return !e.hasTag("e") || e.tagValue("e") === e.tagValue("E");
		} else if (e.kind === NDKKind.Text) {
			return e.getMatchingTags("e").length === 1;
		}
	}
	const isLike = (e: NDKEvent) => {
		return e.kind === NDKKind.Reaction;
	}
	
	const comments = $derived.by(() => relatedEvents.filter(isTopLevelComment));
	const likes = $derived.by(() => relatedEvents.filter(isLike));
	const currentUser = $derived.by(getCurrentUser);
	const likedByCurrentUser = $derived.by(() => likes.some(like => currentUser && like.author.pubkey === currentUser.user!.pubkey));

	const imageUrlRegex = new RegExp(/https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|svg|webp)/g);
	const contentWithoutImeta = event.content.replace(imageUrlRegex, '');
</script>

<Lazy height={500} fadeOptions={{ duration: 0 }}>
	<div class="flex items-center gap-3">
		<a href="/{userProfile?.nip05 || event.author.npub}" class="mb-3 flex items-center gap-3" onclick={(e) => e.stopPropagation()}>
			{#if !userProfile}
				<CircleUser />
			{:else}
				<img src={userProfile?.image} class="w-10 h-10 rounded-full" />
			{/if}
			<div class="flex flex-col">
				<span class="text-sm font-medium">
					{userProfile?.name ?? event.author.npub.substring(0, 10)}
				</span>
				<span class="text-xs text-muted-foreground">
					{userProfile?.display_name}
				</span>
				<span class="text-xs text-muted-foreground">
					{userProfile?.nip05}
					{#if clientName}
						via {clientName}
					{/if}
				</span>
			</div>
		</a>
	
		<Ellipsis class="ml-auto w-fit" />
	</div>

	<button onclick={onclick}>
		<Image
			event={event}
			class="w-full rounded bg-gray-100 object-contain {className}"
			containerClass={"flex flex-row overflow-x-auto whitespace-nowrap items-center items-stretch justify-stretch"}
		/>
	</button>

	<div class="my-2 flex items-center gap-5">
		<React event={event} likedByCurrentUser={likedByCurrentUser} />
		<!-- <MessageCircle /> -->
		<!-- <Send /> -->

		<Bookmark class="ml-auto" />
	</div>

	{#if likes.length > 0}
		<p class="mb-2 text-sm font-medium">
			{likes.length} likes
		</p>
	{/if}
	<p class="mb-2 text-sm font-medium">
		<span class="font-light">{contentWithoutImeta}</span>
	</p>

	{#if comments.length > 0}
		{#each comments.slice(0, maxComments) as comment (comment.id)}
			<Comment event={comment} />
		{/each}
		{#if comments.length > maxComments}
			<button class=" mb-2 text-sm capitalize text-muted-foreground">view all {comments.length} comments</button>
		{/if}
	{/if}

	<div class="mt-4">
		<NewComment event={event} />
	</div>
	<Separator class="mt-3" />
</Lazy>