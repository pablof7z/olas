<script lang="ts">
	import { imetasFromEvent } from '../../../../utils/imeta';
    import Lazy from "svelte-lazy";
    const { event, width = 300 } = $props();

    const imetas = imetasFromEvent(event);
</script>

{#if imetas[0]}
    <Lazy height={width} fadeOptions={{ duration: 0 }}>
        <img src={imetas[0].url} class="w-full h-full object-cover flex-none" style={`width: ${width}px; height: ${width}px;`} />
    </Lazy>
{/if}