import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { BlurView } from 'expo-blur';
import React from 'react';

import { Reactions } from '@/components/events/Post/Reactions';
import TopZaps from '@/components/events/TopZaps';
import EventContent from '@/components/ui/event/content';
import { useReactionsStore } from '@/stores/reactions';

const StoryText = ({ text, event }: { text: string; event: NDKEvent }) => {
    const reactions = useReactionsStore((state) => state.reactions.get(event.tagId()));

    return (
        <BlurView
            tint="dark"
            intensity={100}
            style={{ padding: 16, borderRadius: 4, overflow: 'hidden' }}
        >
            <EventContent
                content={text}
                style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
            />
            <TopZaps event={event} />

            <Reactions event={event} reactions={reactions} inactiveColor="white" />
        </BlurView>
    );
};

export default StoryText;
