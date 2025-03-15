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
	import { NDKNip07Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
	import { getCurrentUser, setCurrentUser } from '$lib/stores/currentUser.svelte';
	import { onMount } from 'svelte';
	import CurrentUserAvatar from './CurrentUserAvatar.svelte';
	import { page } from '$app/state';
	import { createAccount, connectExtension } from '$lib/utils/auth';
	import PostEditor from './PostEditor/index.svelte';

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
			connectExtension().then(success => {
				if (!success) {
					// If extension is available but connection failed, show modal
					openLoginModal = true;
				}
			});
		} else {
			openLoginModal = true;
		}
	}

	async function handleCreateAccount() {
		const user = await createAccount();
		if (user) {
			// Close modal after successful account creation
			openLoginModal = false;
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
			icon: NewPost
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
	let openLoginModal = $state(false);
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
	<Dialog.Content class="max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Create new post</Dialog.Title>
		</Dialog.Header>
		<div class="mt-4">
			<PostEditor on:completed={() => openModal = false}/>
		</div>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={openLoginModal}>
	<Dialog.Content class="max-w-[550px]">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-bold">Get Started with Olas</Dialog.Title>
			<Dialog.Description class="mt-2 text-muted-foreground">
				Connect to the decentralized Nostr network and own your social data.
			</Dialog.Description>
		</Dialog.Header>
		<div class="mt-4 grid gap-6 sm:grid-cols-2">
			<!-- Create Account Path -->
			<div class="rounded-lg border bg-primary/5 p-5 shadow-sm">
				<h3 class="mb-3 text-lg font-medium">Create New Account</h3>
				<p class="mb-4 text-sm text-muted-foreground">
					Quick and easy. We'll generate a secure identity for you that you can backup later.
				</p>
				<div class="space-y-4">
					<Button 
						onclick={handleCreateAccount} 
						class="w-full bg-primary font-medium"
					>
						Create Account
					</Button>
					<div class="text-xs text-muted-foreground">
						<p>A private key will be generated for you.</p>
						<p class="mt-1">Make sure to back it up once you're logged in!</p>
					</div>
				</div>
			</div>

			<!-- Extension Path -->
			<div class="rounded-lg border p-5">
				<h3 class="mb-3 text-lg font-medium">Use Nostr Extension</h3>
				<p class="mb-4 text-sm text-muted-foreground">
					Already using Nostr? Connect with your existing extension.
				</p>
				<div class="space-y-4">
					<Button 
						onclick={connectExtension} 
						variant="outline" 
						class="w-full border-2"
					>
						Connect Extension
					</Button>
					<div class="grid gap-2">
						<a href="https://getalby.com/" target="_blank" class="flex items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-muted">
							<div class="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950">
								<Smartphone class="h-4 w-4 text-amber-600 dark:text-amber-400" />
							</div>
							<div>Alby</div>
						</a>
						<a href="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp" target="_blank" class="flex items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-muted">
							<div class="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950">
								<Command class="h-4 w-4 text-blue-600 dark:text-blue-400" />
							</div>
							<div>nos2x</div>
						</a>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-6 text-center text-xs text-muted-foreground">
			<a href="https://nostr.how" target="_blank" class="inline-flex items-center gap-1 underline">
				Learn more about Nostr
				<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
			</a>
		</div>
	</Dialog.Content>
</Dialog.Root>
