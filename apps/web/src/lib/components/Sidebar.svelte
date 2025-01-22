<script lang="ts">
	import { CircleUser, Menu, ActivitySquare, Bookmark, Sun, Moon, DoorClosed, AppleIcon, Apple, Phone, PhoneIcon, Smartphone, Command } from 'lucide-svelte';
	import Logo from './icons/Logo.svelte';
	import Home from './icons/Home.svelte';
	import NewPost from './icons/NewPost.svelte';
	import Search from './icons/Search.svelte';
	import Reels from './icons/Reels.svelte';
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
	import CurrentUserAvatar from './CurrentUserAvatar.svelte';

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
		{
			text: 'reels',
			icon: Reels,
			disabled: true
		},
		{
			text: 'create',
			icon: NewPost,
		},
		
	];

	const currentUserProfile = $derived.by(() => currentUser?.user ? ndk.cacheAdapter?.fetchProfileSync(currentUser?.user?.pubkey) : null);

	const sidebarItems = $derived.by(() => {
		const items = [...defaultSidebarItems];

		if (currentUserProfile) {
			items.push({
				text: currentUserProfile.name,
				icon: CurrentUserAvatar,
				href: `/${currentUserProfile.nip05 ?? currentUser?.user?.npub }`
			});
		} else if (!currentUser) {
			items.push({
				text: 'login',
				icon: CircleUser,
				onclick: login
			})
		} else {
			items.push({
				text: 'Profile',
				icon: CurrentUserAvatar,
				href: `/${currentUser?.user?.npub}`
			})
		}

		return items;
	});

	let openModal = $state(false);
</script>

<aside
	class="bg-background fixed bottom-0 left-0 right-0 flex flex-row md:flex-col md:fixed md:top-0 md:left-0 md:right-auto md:h-full md:w-[244px] border-t md:border-r p-1 md:p-3 w-full z-50"
>
	<div class="my-4 pl-3 md:my-8 md:pl-3 hidden md:block">
		<div class="hidden md:inline-block">
			<Logo />
		</div>
	</div>
	<div class="flex flex-1 flex-row md:flex-col md:gap-2">
		{#each sidebarItems as { text, icon, href, disabled, onclick }}
			<svelte:element
				this={href ? 'a' : text === 'create' ? 'button' : 'div'}
				{href}
				role="none"
				class="hover:bg-muted flex flex-1 md:flex-none justify-center md:justify-start items-center gap-1 rounded-md p-2 md:p-3 text-sm capitalize {disabled && 'opacity-50 pointer-events-none cursor-not-allowed'}"
				onclick={() => {
					if (text === 'create') {
						openModal = true;
					}
					onclick?.();
				}}
			>
				<svelte:component this={icon} />
				<div
					class={cn('ml-0 md:ml-4 hidden md:inline-flex', {
						'font-bold': text === 'home'
					})}
				>
					{text}
				</div>
			</svelte:element>
		{/each}
	</div>

	{#if !currentUser}
		<Button variant="default" class="w-full md:hidden" onclick={login}>
			Login
		</Button>
	{/if}

	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class="hover:bg-muted flex justify-center md:justify-start cursor-pointer items-center gap-1 rounded-md p-2 md:p-3 text-sm capitalize"
		>
			<Menu />
			<div class="ml-0 md:ml-4 hidden md:inline-block">More</div>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-full md:w-[300px] rounded-xl p-3 shadow-lg">
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
					<DoorClosed />
					Logout
				</DropdownMenu.Item>

				<DropdownMenu.Item href="https://testflight.apple.com/join/2FMVX2yM" class="flex cursor-pointer items-center gap-2 p-3">
					<Command />
					Download on Apple Store
				</DropdownMenu.Item>

				<DropdownMenu.Item href="https://github.com/pablof7z/olas/releases" class="flex cursor-pointer items-center gap-2 p-3">
					<Smartphone />
					Download Android APK
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
