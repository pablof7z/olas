<script lang="ts">
	import { getCurrentUser } from "$lib/stores/currentUser.svelte";
	import ndk from '$lib/stores/ndk.svelte';
	import { getProxiedImageUrl } from "../../utils/imgproxy";

    const currentUser = $derived(getCurrentUser());
    const currentUserProfile = $derived.by(() => currentUser?.user ? ndk.cacheAdapter?.fetchProfileSync(currentUser?.user?.pubkey) : null);

    const proxiedUrl = $derived.by(() => currentUserProfile?.image ? getProxiedImageUrl(currentUserProfile.image, 24) : null);
</script>

<img src={proxiedUrl} alt={currentUserProfile?.name} class="w-6 h-6 rounded-full" />