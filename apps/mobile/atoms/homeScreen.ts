import { NDKEventWithFrom } from '@nostr-dev-kit/ndk-mobile/src/hooks/subscribe';
import { FlashList } from '@shopify/flash-list';
import { atom } from 'jotai';
import { RefObject } from 'react';

export const homeScreenScrollRef = atom<RefObject<FlashList<any>> | null>(null);
