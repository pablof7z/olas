import { Hexpubkey } from '@nostr-dev-kit/ndk-mobile';

export type GroupEntry = {
    groupId: string;
    relayUrls?: string[];
    name?: string;
    about?: string;
    picture?: string;
    members: Set<Hexpubkey>;
};
