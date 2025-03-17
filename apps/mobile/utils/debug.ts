import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";

export function debugEvent(event: NDKEvent, message?: string) {
    console.log(message || 'Event', JSON.stringify(event.rawEvent(), null, 4));
}