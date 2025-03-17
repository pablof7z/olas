our custom types
export enum NDKStoryStickerType {
    // Include all original types
    Text = NDKOriginalStoryStickerType.Text,
    Pubkey = NDKOriginalStoryStickerType.Pubkey,
    Event = NDKOriginalStoryStickerType.Event,
    Countdown = NDKOriginalStoryStickerType.Countdown,
    Prompt = NDKOriginalStoryStickerType.Prompt,
    
    // Add our custom types
    NostrFilter = 'nostr-filter'
}