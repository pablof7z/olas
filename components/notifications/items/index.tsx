import { type NDKEvent, NDKKind, type NDKUser } from '@nostr-dev-kit/ndk-mobile';

import { ItemNutzap } from './nutzap';
import { NotificationContainer } from './wrapper';

export default function NotificationItem({
    event,
    currentUser,
}: { event: NDKEvent; currentUser: NDKUser }) {
    let label: string;

    switch (event.kind) {
        case NDKKind.GenericRepost:
            label = 'reposted you';
            break;
        case NDKKind.Reaction:
            label = 'reacted to your post';
            break;
        case NDKKind.Text:
        case NDKKind.GenericReply:
            label = getLabelForCommentNotification(event, currentUser);
            break;
        case NDKKind.Zap:
            label = 'LN zapped you';
            break;
        case NDKKind.Nutzap:
            label = 'zapped you';
            break;
        case 3006:
            label = 'bookmarked your post';
            break;
        case 967:
            label = 'followed you';
            break;
        default:
            label = event.kind.toString();
    }

    return (
        <NotificationContainer event={event} label={label}>
            {event.kind === NDKKind.Nutzap && <ItemNutzap event={event} />}
        </NotificationContainer>
    );
}

function getLabelForCommentNotification(event: NDKEvent, currentUser: NDKUser) {
    if (event.kind === NDKKind.GenericReply) {
        // if the current user is in the P tag
        if (event.tagValue('P') === currentUser?.pubkey) return 'commented on your post';
        else if (event.tagValue('p') === currentUser?.pubkey) return 'replied to your comment';
        return 'replied';
    }

    return 'replied to your post';
}

type NotificationItem = {
    id: string;
    type: 'follow' | 'comment' | 'mention' | 'reaction' | 'bookmark';
    user: {
        username: string;
        avatar: string;
    };
    timestamp: string;
    content?: string;
};
