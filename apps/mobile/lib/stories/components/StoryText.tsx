import React, { useEffect, useState } from 'react';
import {
  Canvas,
  Text,
  Shadow,
  Skia,
  vec,
  TileMode,
} from '@shopify/react-native-skia';
import { Dimensions, View } from 'react-native';
import { AnimatedSentence } from '@/components/AnimatedSentence';
import EventContent from '@/components/ui/event/content';
import { BlurView } from 'expo-blur';
import { Reactions } from '@/components/events/Post/Reactions';
import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import TopZaps from '@/components/events/TopZaps';

const StoryText = ({ text, event }: { text: string, event: NDKEvent }) => {
    return (
        <BlurView tint="dark" intensity={100} style={{ padding: 16, borderRadius: 4 , overflow: 'hidden' }}>
            <EventContent content={text} style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }} />
            <TopZaps event={event} />

            <Reactions event={event} inactiveColor={"white"} />
        </BlurView>
    )
    
    return (
        <AnimatedSentence>
            {text}
        </AnimatedSentence>
    )
};

export default StoryText; 