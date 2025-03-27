import { NDKKind, NDKList, useNDKSessionEventKind } from '@nostr-dev-kit/ndk-mobile';

export const DEFAULT_BLOSSOM_SERVER = 'https://blossom.primal.net' as const;

export function useActiveBlossomServer() {
    const blossomList = useNDKSessionEventKind<NDKList>(NDKKind.BlossomList, { create: NDKList });
    const defaultBlossomServer = blossomList.items.find((item) => item[0] === 'server')?.[1] ?? DEFAULT_BLOSSOM_SERVER;
    return defaultBlossomServer;
}
