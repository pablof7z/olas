import { NDKCashuMintList, type NDKEvent, NDKKind, NDKList, useSessionMonitor } from "@nostr-dev-kit/ndk-mobile";

const events = new Map();
events.set(NDKKind.BlossomList, NDKList);
events.set(NDKCashuMintList.kind, NDKCashuMintList);

export default function SessionMonitor() {
    console.log('SessionMonitor mounted');
    useSessionMonitor({
        profile: true,
        follows: [NDKKind.Image],
        events
    })

    return null;
}
