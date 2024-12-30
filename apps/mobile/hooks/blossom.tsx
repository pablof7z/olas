import { NDKKind } from "@nostr-dev-kit/ndk-mobile";
import { NDKList } from "@nostr-dev-kit/ndk-mobile";
import { useNDKSessionEventKind } from "@nostr-dev-kit/ndk-mobile";

export const DEFAULT_BLOSSOM_SERVER = 'https://blossom.primal.net' as const;

export function useActiveBlossomServer() {
    const blossomList = useNDKSessionEventKind<NDKList>(NDKList, NDKKind.BlossomList, { create: true });
    const defaultBlossomServer = blossomList?.items.find((item) => item[0] === 'server')?.[1] ?? DEFAULT_BLOSSOM_SERVER;
    return defaultBlossomServer;
}