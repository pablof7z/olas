import { NDKStory } from '@nostr-dev-kit/ndk-mobile';
import { useEffect } from 'react';
import { View } from 'react-native';
import { durationAtom, isLoadingAtom } from './store';
import { useSetAtom } from 'jotai';
import SimpleStoryViewer from '../components/StoryViewer';

export function SlideStory({ story }: { story: NDKStory }) {
    const setIsLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);

    useEffect(() => {
        setIsLoading(false);
        setDuration(8000); // Default duration for stories
    }, [story, setIsLoading, setDuration]);

    return (
        <View style={{ flex: 1 }}>
            <SimpleStoryViewer story={story} />
        </View>
    );
} 