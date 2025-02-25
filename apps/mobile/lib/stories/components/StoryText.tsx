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

const StoryText = ({ text }: { text: string }) => {
    return (
        <BlurView tint="dark" intensity={100} style={{ padding: 16, borderRadius: 4 , overflow: 'hidden' }}>
            <EventContent content={text} style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }} />
        </BlurView>
    )
    
    return (
        <AnimatedSentence>
            {text}
        </AnimatedSentence>
    )
};

export default StoryText; 