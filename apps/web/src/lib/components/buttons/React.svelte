<script lang="ts">
	import { Heart } from "lucide-svelte";

    const { event, likedByCurrentUser } = $props();
    
    function like() {
		const like = event.react("+");
		like.tags.push(['k', event.kind.toString()])
		like.publish();
	}
</script>

<button onclick={like}>
    <Heart class={likedByCurrentUser ? "fill-red-500 text-red-500" : ""} />
</button>
