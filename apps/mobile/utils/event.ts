import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';

export function getClientName(event: NDKEvent) {
    let clientName = event.tagValue('client');
    if (!clientName && event.alt?.match(/Olas/)) clientName = 'Olas';

    if (clientName?.startsWith('31990')) clientName = undefined;
    return clientName;
}
