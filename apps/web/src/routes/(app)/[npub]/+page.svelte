<script lang="ts">
	import { NDKKind, NDKUser, type NDKEvent, type NDKUserProfile } from '@nostr-dev-kit/ndk';
	import ndk from '$lib/stores/ndk.svelte';
	import { Button } from '$lib/components/ui/button';
	import { getCurrentUser } from '$lib/stores/currentUser.svelte';
	import { page } from '$app/stores';
	import * as Post from '$lib/components/Post';

	// get the pubkey from the url
	const { npub } = $page.params;
	let user = $state<NDKUser | null>(null);
	$inspect(user);

	try {
		const u = ndk.getUser({ npub });
		!!u.pubkey;
		user = u;
	} catch (e) {
		NDKUser.fromNip05(npub, ndk)
			.then(u => {
				if (u) user = u;
			})
			.catch(e => {
				console.error(e);
			});
	}

	const currentUser = $derived.by(getCurrentUser);
	let userProfile = $state<NDKUserProfile | null>(null);
	const IMAGE_URL_REGEX = new RegExp(/https?:\/\/.*\.(jpg|jpeg|png|gif|bmp|svg|webp)/g);

	let events = $state<NDKEvent[] | null>(null);
	let selectedEvents = $derived.by(() => {
		const filteredEvents: NDKEvent[] = [];

		for (const e of events) {
			if (e.kind === NDKKind.Image) filteredEvents.push(e);
			else if (e.kind === NDKKind.Text) {
				if (e.hasTag('e')) continue;
				else if (e.hasTag('imeta')) filteredEvents.push(e);
				else if (e.content.match(IMAGE_URL_REGEX)) filteredEvents.push(e);
			}
		}
		return filteredEvents;
	});

	$effect(() => {
		console.log('fetching user profile', user);
		if (user && !userProfile) {
			const sync = ndk.cacheAdapter?.fetchProfileSync?.(user.pubkey);
			if (sync) {
				userProfile = sync;
			} else {
				user.fetchProfile().then(profile => {
					console.log('fetched user profile', profile);
					userProfile = profile}).catch(e => console.error(e));
			}
		}
	});

	$effect(() => {
		console.log('fetching events', user);
		if (user && !events) {
			events = ndk.$subscribe([
				{ kinds: [20], authors: [user.pubkey] },
				{ kinds: [1], "#k": ["20"], authors: [user.pubkey] },
			]);
		} else {
			console.log('not going to fetch')
		}
	});

	async function handleFollow() {
		if (!currentUser || !user) return;
		await currentUser.follow(user);
	}

	let openModal = $state(false);
	let selectedEvent = $state<NDKEvent | null>(null);
</script>

{#if user && events}
<div class="mx-auto max-w-4xl md:px-4 px-1">
	<div class="mb-8 flex items-start gap-8 py-8">
		<div class="shrink-0">
			{#if userProfile?.image}
				<img
					src={userProfile.image}
					alt={userProfile.name}
					class="h-36 w-36 rounded-full object-cover"
				/>
			{:else}
				<div class="h-36 w-36 rounded-full bg-muted" />
			{/if}
		</div>
		<div class="flex-1">
			<div class="mb-4 flex items-center gap-4">
				<h1 class="text-xl font-semibold">{userProfile?.name || 'Anonymous'}</h1>
				{#if currentUser?.user?.pubkey !== user.pubkey && !currentUser?.follows.has(user.pubkey)}
					<Button variant="outline" on:click={handleFollow}>
						{currentUser?.follows.has(user.pubkey) ? 'Following' : 'Follow'}
					</Button>
				{/if}
			</div>
			<div class="mb-4 flex gap-8">
				<div><strong>{selectedEvents.length}</strong> posts</div>
			</div>
			{#if userProfile?.about}
				<p class="whitespace-pre-wrap">{userProfile.about}</p>
			{/if}
		</div>
	</div>

	<Post.Grid events={selectedEvents} />
</div>
{/if}

{#if openModal}
	<Post.Modal event={selectedEvent} bind:opened={openModal} />
{/if}
