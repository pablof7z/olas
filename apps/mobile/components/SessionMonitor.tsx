import { NDKKind, useSessionMonitor } from "@nostr-dev-kit/ndk-mobile";

export default function SessionMonitor() {
    console.log('SessionMonitor mounted');
    useSessionMonitor({
        profile: true,
        follows: [NDKKind.Image],
        muteList: true
    })

    return null;
}
