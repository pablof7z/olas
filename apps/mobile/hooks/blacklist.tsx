import NDK, {
    Hexpubkey,
    NDKEvent,
    NDKEventId,
    NDKFilter,
    NDKKind,
    NDKSubscription,
    NDKSubscriptionCacheUsage,
    useFollows,
    useMuteList,
    useNDK,
    wrapEvent,
} from '@nostr-dev-kit/ndk-mobile';
import { useMemo } from 'react';

import { blacklistPubkeys } from '@/utils/const';

/**
 * Returns a set of pubkeys that should be blacklisted
 */
export function usePubkeyBlacklist() {
    const { muteList } = useMuteList();
    const follows = useFollows();

    const list = new Set(blacklistPubkeys);

    const effectiveBlackList = useMemo(() => {
        if (muteList) muteList.forEach((p) => list.add(p));
        if (follows) for (const pk of follows) list.delete(pk);
        return list;
    }, [muteList?.size, follows?.length]);

    return effectiveBlackList;
}
