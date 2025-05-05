import { NDKCashuMintList, type NDKEvent, NDKKind, NDKList } from '@nostr-dev-kit/ndk';
import { useSessionMonitor } from '@nostr-dev-kit/ndk-mobile';

const events = new Map();
events.set(NDKKind.BlossomList, NDKList);
events.set(NDKCashuMintList.kind, NDKCashuMintList);

export default function SessionMonitor() {
    useSessionMonitor({
        profile: true,
        follows: [NDKKind.Image],
        events,
    });

    return null;
}
