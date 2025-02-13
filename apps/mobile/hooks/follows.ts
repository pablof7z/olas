import { Hexpubkey, useFollows } from "@nostr-dev-kit/ndk-mobile";
import { usePrivateFollows } from "@/stores/db/private-follows";

export function usePublicFollowSet() {
    const publicFollows = useFollows();
    return new Set(publicFollows);
}

export function useAllFollows() {
    const publicFollows = useFollows() ?? [];
    const privateFollows = usePrivateFollows();
    
    // merge and return
    const allFollows = new Set([...publicFollows, ...Array.from(privateFollows?.pubkeys ?? [])]);
    return allFollows;
}

type FollowType = 'public' | 'private';

export function useFollowType(pubkey: Hexpubkey): FollowType | undefined {
    const privateFollows = usePrivateFollows();
    const publicFollows = usePublicFollowSet();

    if (!pubkey) return undefined;

    if (publicFollows.has(pubkey)) return 'public';
    if (privateFollows.pubkeys.has(pubkey)) return 'private';
}