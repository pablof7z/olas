<script lang="ts">
	import { page } from "$app/stores";
	import * as Post from "$lib/components/Post";
    import ndk from "$lib/stores/ndk.svelte";
    import { imetasFromEvent } from '$utils/imeta';

    const { bech32 } = $page.params;
</script>

<svelte:head>
    {#await ndk.fetchEvent(bech32)}
        <title>Loading...</title>
    {:then event}
        {#if event}
            {@const imetas = imetasFromEvent(event)}
            {#if imetas.length > 0 && imetas[0].url}
                <meta property="og:image" content={imetas[0].url} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:image" content={imetas[0].url} />
            {/if}
            <meta property="og:description" content={event.content} />
            <title>{event.content.slice(0, 60)}...</title>
        {/if}
    {/await}
</svelte:head>

<div class="flex flex-col gap-5 lg:flex-row">
	<div class="flex-1 lg:flex-shrink-0">
		<div class="mx-auto w-full max-w-[630px]">
            {#await ndk.fetchEvent(bech32)}
                loading
            {:then event}
                <Post.Card
                    event={event}
                    class="w-full snap-x"
                    containerClass="w-full flex flex-row overflow-x-auto snap-x snap-mandatory"
                    maxComments={999999}
                />
            {/await}
        </div>
    </div>
</div>