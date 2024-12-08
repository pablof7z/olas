<script lang="ts">
	import { CircleUser, Menu, ActivitySquare, Bookmark, Sun, Moon } from 'lucide-svelte';
	import Logo from './icons/Logo.svelte';
	import Home from './icons/Home.svelte';
	import Search from './icons/Search.svelte';
	import Reels from './icons/Reels.svelte';
	import Messenger from './icons/Messenger.svelte';
	import Notifications from './icons/Notifications.svelte';
	import NewPost from './icons/NewPost.svelte';
	import { cn } from '$lib/utils';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import Media from './icons/media.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Settings from './icons/Settings.svelte';
	import { mode, toggleMode } from 'mode-watcher';
	import ndk from '$lib/stores/ndk.svelte';
	import { NDKNip07Signer } from '@nostr-dev-kit/ndk';
	import { getCurrentUser, setCurrentUser } from '$lib/stores/currentUser.svelte';
	import { onMount } from 'svelte';

	const currentUser = $derived(getCurrentUser());

	function login() {
		if (window.nostr) {
			ndk.signer = new NDKNip07Signer();
			ndk.signer.user().then((user) => {
				console.log('user', user);
				setCurrentUser(user);
			});
		}
	}
	
	onMount(() => {
		if (window.nostr) login();
	})

	const defaultSidebarItems = [
		{
			text: 'home',
			icon: Home,
			href: '/'
		},
		{
			text: 'search',
			icon: Search,
			href: '/search/nostr'
		},
		// {
		// 	text: 'explore',
		// 	icon: Explore
		// },
		{
			text: 'reels',
			icon: Reels,
			disabled: true
		},
		// {
		// 	text: 'messages',
		// 	icon: Messenger
		// },
		// {
		// 	text: 'notifications',
		// 	icon: Notifications,
		// 	disabled: true
		// },
		// {
		// 	text: 'create',
		// 	icon: NewPost,
		// 	disabled: true
		// },
		
	];

	const sidebarItems = $derived.by(() => {
		const items = [...defaultSidebarItems];

		const currentUserProfile = ndk.cacheAdapter?.fetchProfileSync(currentUser?.user?.pubkey);

		if (currentUserProfile) {
			items.push({
				text: currentUserProfile.name,
				icon: currentUserProfile.image,
				href: `/p/${currentUser.user!.npub}`
			});
		} else {
			items.push({
				text: 'login',
				icon: CircleUser,
				onclick: login
			})
		}

		return items;
	});

	let openModal = $state(false);
</script>

<aside
	class="bg-background fixed flex h-full min-h-screen w-fit flex-col border-r p-3 md:w-[244px]"
>
	<div class="my-8 pl-3">
		<div class="hidden w-fit md:inline-block">
			<Logo />
		</div>
	</div>
	<div class="flex flex-1 flex-col gap-2">
		{#each sidebarItems as { text, icon, href, disabled }}
			<svelte:element
				this={href ? 'a' : text === 'create' ? 'button' : 'div'}
				{href}
				role="none"
				class="hover:bg-muted flex cursor-pointer items-center gap-1 rounded-md p-3 text-sm capitalize {disabled && 'opacity-50 pointer-events-none cursor-not-allowed'}"
				disabled={disabled}
				onclick={() => {
					if (text === 'create') {
						openModal = true;
					}
				}}
			>
				<svelte:component this={icon} />
				<div
					class={cn('ml-4 hidden md:inline-flex', {
						'font-bold': text === 'home'
					})}
				>
					{text}
				</div>
			</svelte:element>
		{/each}
	</div>

	{#if !currentUser}
		<Button variant="default" class="w-full" onclick={login}>
			Login
		</Button>
	{/if}

	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class="hover:bg-muted flex cursor-pointer items-center gap-1 rounded-md p-3 text-sm capitalize"
		>
			<Menu />
			<div class="ml-4 hidden md:inline-block">More</div>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-[300px] rounded-xl p-3 shadow-lg">
			<DropdownMenu.Group>
				<DropdownMenu.Item href="/" class="flex cursor-pointer items-center gap-2 p-3">
					<Settings />
					Settings
				</DropdownMenu.Item>
				<DropdownMenu.Item href="/" class="flex cursor-pointer items-center gap-2 p-3">
					<ActivitySquare />
					Your Activity
				</DropdownMenu.Item>
				<DropdownMenu.Item href="/" class="flex cursor-pointer items-center gap-2 p-3">
					<Bookmark />
					Saved
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={toggleMode} class="flex cursor-pointer items-center gap-2 p-3">
					{#if $mode === 'dark'}
						<Sun />
						light mode
					{:else if $mode === 'light'}
						<Moon />
						dark mode
					{/if}
				</DropdownMenu.Item>
				<DropdownMenu.Item href="/" class="flex cursor-pointer items-center gap-2 p-3">
					Logout
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</aside>

<Dialog.Root bind:open={openModal}>
	<Dialog.Content class="max-w-[450px]">
		<Dialog.Header>
			<Dialog.Title>Create a new post</Dialog.Title>
			<form action="/?/createPost" enctype="multipart/form-data">
				<div class="grid h-fit place-items-center">
					<div class="absolute space-y-3 text-center">
						<div class="max-auto w-fit">
							<Media />
						</div>
						<p>Drag Photos and Videos Here</p>
						<Button size="sm" class="bg-blue-500">select from computer</Button>
					</div>
					<input
						class="h-[350px] w-full bg-transparent text-transparent file:hidden"
						type="file"
						accept="image/png, image/jpeg"
						name="imageUrl"
					/>
				</div>

				<Form.Button class="bg-blue-500">Submit</Form.Button>
			</form>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
