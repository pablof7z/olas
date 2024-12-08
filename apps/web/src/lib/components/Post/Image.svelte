<script lang="ts">
	import type { NDKEvent, NDKTag } from "@nostr-dev-kit/ndk";
	import { getProxiedImageUrl } from "../../../utils/imgproxy";
	import { imetasFromEvent } from "../../../utils/imeta";

    const { event, width = 800, containerClass = "", class: imgClass = "", style } = $props();

    const imetas = imetasFromEvent(event);
</script>

<div class="overflow-x-auto whitespace-nowrap {containerClass}">
    {#each imetas as imeta}
        {#if imeta.url}
            <img on:load style={style} src={getProxiedImageUrl(imeta.url, width, 3)} class={imgClass} alt={imeta.alt} />
        {/if}
    {/each}
</div>
