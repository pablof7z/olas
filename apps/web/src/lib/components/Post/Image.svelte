<script lang="ts">
	import { getProxiedImageUrl } from "../../../utils/imgproxy";
	import { imetasFromEvent } from "../../../utils/imeta";

    const { onload = undefined, event, width = 800, containerClass = "", class: imgClass = "", style = "" } = $props();

    const imetas = imetasFromEvent(event);
</script>

<div class="relative">
    <div class="overflow-x-auto whitespace-nowrap relative {containerClass}">
        {#each imetas as imeta, i (imeta.url)}
            {#if imeta.url}
                <img onload={(e) => {if (i === 0) onload?.(e)}} style={style} src={getProxiedImageUrl(imeta.url, width, 3)} class={imgClass} alt={imeta.alt} />
            {/if}
        {/each}
    </div>

    {#if imetas.length > 1}
        <div class="absolute bottom-2 left-1/2 -translate-x-1/2 mx-auto flex gap-1 justify-center mt-2 z-50">
            {#each imetas as _, i}
                <div class="w-2 h-2 rounded-full bg-gray-300"></div>
            {/each}
        </div>
    {/if}
</div>