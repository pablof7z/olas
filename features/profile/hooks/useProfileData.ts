import { useMemo } from 'react';
import { useNDK, useProfileValue, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, NDKKind, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { useUserFlare } from '@/lib/user/stores/flare';

/**
 * Hook to fetch and derive profile data for a given pubkey.
 * @param pubkey - The public key of the user.
 * @returns User object, profile, content/events, flare, follow count, and hasProducts flag.
 */
function useProfileData(pubkey: string) {
  const { ndk } = useNDK();
  const user: NDKUser | undefined = ndk?.getUser({ pubkey });
  const userProfile: NDKUserProfile | undefined = useProfileValue(pubkey, { subOpts: { skipVerification: true } });
  const flare = useUserFlare(pubkey);

  const { events: content } = useSubscribe(
    [
      { kinds: [NDKKind.Image, NDKKind.VerticalVideo, 21], authors: [pubkey] },
      { kinds: [NDKKind.Text], '#k': ['20'], authors: [pubkey] },
      { kinds: [NDKKind.Text], authors: [pubkey] },
      { kinds: [30402], authors: [pubkey] },
      { kinds: [NDKKind.Metadata, NDKKind.Contacts], authors: [pubkey] },
    ],
    { wrap: true, skipVerification: true },
    [pubkey]
  );

  const followCount = useMemo(() => {
    const contacts = content.find((e: NDKEvent) => e.kind === NDKKind.Contacts);
    if (!contacts) return 0;
    const followTags = contacts.tags.filter((t: string[]) => t[0] === 'p');
    if (!followTags) return 0;
    return new Set(followTags.map((t: string[]) => t[1])).size;
  }, [content]);

  const hasProducts = useMemo(() => {
    return content.some((e: NDKEvent) => e.kind === 30402);
  }, [content]);

  return {
    user,
    userProfile,
    content,
    flare,
    followCount,
    hasProducts,
  };
}

export default useProfileData;