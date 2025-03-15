<script lang="ts">
    import type { HTMLTextareaAttributes } from "svelte/elements";
    import { cn } from "$lib/utils.js";

    type $$Props = HTMLTextareaAttributes;
    
    let className: $$Props["class"] = undefined;
    export let value: $$Props["value"] = undefined;
    export { className as class };
    
    export let readonly: $$Props["readonly"] = undefined;
</script>

<textarea
    class={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
    )}
    bind:value
    {readonly}
    on:blur
    on:change
    on:click
    on:focus
    on:focusin
    on:focusout
    on:keydown
    on:keypress
    on:keyup
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:mousemove
    on:paste
    on:input
    {...$$restProps}
/> 