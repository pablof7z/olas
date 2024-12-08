<script lang="ts">
	import { imetasFromEvent } from '../../../../utils/imeta';
    const { event, width = 300 } = $props();

    const imetas = imetasFromEvent(event);
</script>

{#if imetas[0]}
    <img src={imetas[0].url} class="w-full h-full object-cover" style={`width: ${width}px; height: ${width}px;`} />
{/if}