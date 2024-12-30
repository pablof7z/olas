<script lang="ts">
    import { type NDKUserProfile } from "@nostr-dev-kit/ndk";

    const { event } = $props();

    let profile = $state<NDKUserProfile | null>(null);
    
    event.author.fetchProfile().then(p => profile = p);

    let url = $derived(`/${profile?.nip05 ||event.author.npub}`);
</script>

<div class="w-full whitespace-pre-wrap overflow-x-clip">
    <a href={url} class="font-bold whitespace-nowrap max-w-40 overflow-clip">{profile?.name || event.author.npub.slice(0, 6)}</a>
    {event.content}
</div>