<script lang="ts">
	import { page } from "$app/stores";
	import * as Post from "$lib/components/Post";
    import ndk from "$lib/stores/ndk.svelte";

    const { bech32 } = $page.params;
</script>

<div class="flex flex-col gap-5 lg:flex-row">
	<div class="flex-1 lg:flex-shrink-0">
		<div class="mx-auto w-full max-w-[630px]">
            {#await ndk.fetchEvent(bech32)}
                loading
            {:then event}
                <Post.Card event={event} containerClass="w-full" maxComments={999999} />
            {/await}
        </div>
    </div>
</div>