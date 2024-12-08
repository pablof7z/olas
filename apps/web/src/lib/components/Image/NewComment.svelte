<script lang="ts">
    const { event } = $props();

    let input = $state('');

    async function handleSubmit() {
        const reply = event.reply();
        reply.content = input;
        await reply.sign();
        input = '';
        await reply.publish();
    }

    function onEnter(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    }
</script>

<input
    type="text"
    bind:value={input}
    class="block border-none bg-transparent outline-none placeholder:text-sm w-full"
    placeholder="Add a comment"
    onkeydown={onEnter}
/>