import { useSessionMonitor } from "@nostr-dev-kit/ndk-mobile";

export default function SessionMonitor() {
    useSessionMonitor({
        profile: true,
        follows: true,
        muteList: true
    })

    return null;
}