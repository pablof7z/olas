<script lang="ts">
    import { type NDKUserProfile } from "@nostr-dev-kit/ndk";

    const { event } = $props();

    let profile = $state<NDKUserProfile | null>(null);
    
    event.author.fetchProfile().then(p => profile = p);
</script>

<div class="w-full whitespace-pre-wrap overflow-x-clip">
    <b class="whitespace-nowrap max-w-40 overflow-clip">{profile?.name || event.author.npub.slice(0, 6)}</b>
    {event.content}
</div>