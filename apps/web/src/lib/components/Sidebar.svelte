<script lang="ts">
	import {
		CircleUser,
		Menu,
		ActivitySquare,
		Bookmark,
		Sun,
		Moon,
		DoorClosed,
		Smartphone,
		Command
	} from 'lucide-svelte';
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
	import { page } from '$app/state';

	type SidebarItem = {
		text: string;
		icon?: any;
		href?: string;
		disabled?: boolean;
		onclick?: () => void;
	};

	const currentUser = $derived(getCurrentUser());
	const currentRoute = $derived(page.url.pathname);

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
	});

	let defaultSidebarItems: SidebarItem[] = $derived([
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
			disabled: true
		}
	]);

	const currentUserProfile = $derived.by(() =>
		currentUser?.user ? ndk.cacheAdapter?.fetchProfileSync?.(currentUser?.user?.pubkey) : null
	);

	const sidebarItems = $derived.by(() => {
		const items = [...defaultSidebarItems];

		if (currentUserProfile) {
			items.push({
				text: currentUserProfile.name ?? 'Unknown User',
				icon: CurrentUserAvatar,
				href: `/${currentUserProfile.nip05 ?? currentUser?.user?.npub}`
			});
		} else if (!currentUser) {
			items.push({
				text: 'login',
				icon: CircleUser,
				onclick: login
			});
		} else {
			items.push({
				text: 'Profile',
				icon: CurrentUserAvatar,
				href: `/${currentUser?.user?.npub}`
			});
		}

		return items;
	});

	let openModal = $state(false);
</script>

<aside
	class="fixed bottom-0 left-0 right-0 z-50 flex w-full flex-row border-t bg-background p-1 md:fixed md:left-0 md:right-auto md:top-0 md:h-full md:w-[244px] md:flex-col md:border-r md:p-3"
>
	<div class="my-4 hidden pl-3 md:my-8 md:block md:pl-3">
		<div class="hidden md:inline-block">
			<Logo />
		</div>
	</div>
	<div class="flex flex-1 flex-row gap-1 md:flex-col md:gap-2">
		{#each sidebarItems as { text, icon, href, disabled, onclick }}
			<svelte:element
				this={href ? 'a' : text === 'create' ? 'button' : 'div'}
				{href}
				role="none"
				class="flex flex-1 items-center justify-center rounded-md p-2 text-sm capitalize hover:bg-muted md:flex-none md:justify-start md:p-3 {disabled &&
					'pointer-events-none cursor-not-allowed opacity-50'}{cn({
					'cursor-default bg-muted font-bold': currentRoute === href
				})}"
				onclick={() => {
					if (text === 'create') {
						openModal = true;
					}
					onclick?.();
				}}
			>
				<svelte:component this={icon} />
				<div class="ml-0 hidden md:ml-4 md:inline-flex">
					{text}
				</div>
			</svelte:element>
		{/each}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="flex flex-1 items-center justify-center rounded-md p-2 text-sm capitalize hover:bg-muted md:mt-auto md:flex-none md:justify-start md:p-3"
			>
				<Menu />
				<div class="ml-0 hidden md:ml-4 md:inline-block">More</div>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-full rounded-xl p-3 shadow-lg md:w-[300px]">
				<DropdownMenu.Group>
					<DropdownMenu.Item
						href="/"
						class="pointer-events-none flex cursor-not-allowed cursor-pointer items-center gap-2 p-3 opacity-50"
					>
						<Settings />
						Settings
					</DropdownMenu.Item>
					<DropdownMenu.Item
						href="/"
						class="pointer-events-none flex cursor-not-allowed cursor-pointer items-center gap-2 p-3 opacity-50"
					>
						<ActivitySquare />
						Your Activity
					</DropdownMenu.Item>
					<DropdownMenu.Item
						href="/"
						class="pointer-events-none flex cursor-not-allowed cursor-pointer items-center gap-2 p-3 opacity-50"
					>
						<Bookmark />
						Saved
					</DropdownMenu.Item>
					<DropdownMenu.Item
						onclick={toggleMode}
						class="flex cursor-pointer items-center gap-2 p-3"
					>
						{#if $mode === 'dark'}
							<Sun />
							light mode
						{:else if $mode === 'light'}
							<Moon />
							dark mode
						{/if}
					</DropdownMenu.Item>
					<DropdownMenu.Item
						href="/"
						class="pointer-events-none flex cursor-not-allowed cursor-pointer items-center gap-2 p-3 opacity-50"
					>
						<DoorClosed />
						Logout
					</DropdownMenu.Item>

					<DropdownMenu.Item
						href="https://testflight.apple.com/join/2FMVX2yM"
						class="flex cursor-pointer items-center gap-2 p-3"
					>
						<Command />
						Download on Apple Store
					</DropdownMenu.Item>

					<DropdownMenu.Item
						href="https://github.com/pablof7z/olas/releases"
						class="flex cursor-pointer items-center gap-2 p-3"
					>
						<Smartphone />
						Download Android APK
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
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
