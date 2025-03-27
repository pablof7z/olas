import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { Canvas, Text, Shadow, Skia, vec, TileMode } from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Dimensions, View } from 'react-native';

import { AnimatedSentence } from '@/components/AnimatedSentence';
import { Reactions } from '@/components/events/Post/Reactions';
import TopZaps from '@/components/events/TopZaps';
import EventContent from '@/components/ui/event/content';
import { useReactionsStore } from '@/stores/reactions';

const StoryText = ({ text, event }: { text: string; event: NDKEvent }) => {
    const reactions = useReactionsStore((state) => state.reactions.get(event.tagId()));

    return (
        <BlurView tint="dark" intensity={100} style={{ padding: 16, borderRadius: 4, overflow: 'hidden' }}>
            <EventContent content={text} style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }} />
            <TopZaps event={event} />

            <Reactions event={event} reactions={reactions} inactiveColor="white" />
        </BlurView>
    );

    return <AnimatedSentence>{text}</AnimatedSentence>;
};

export default StoryText;
