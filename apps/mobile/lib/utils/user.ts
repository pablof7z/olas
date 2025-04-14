import type { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';

export function isUserProfileDeleted(userProfile: NDKUserProfile | undefined) {
    return userProfile?.name === 'deleted-account';
}
