import { NDKStory } from '@nostr-dev-kit/ndk-mobile';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { View } from 'react-native';

import { durationAtom, isLoadingAtom } from './store';
import SimpleStoryViewer from '../components/StoryViewer';

export function SlideStory({ story }: { story: NDKStory }) {
    const setIsLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);

    useEffect(() => {
        setIsLoading(false);
        setDuration(8000); // Default duration for stories
    }, [story, setIsLoading, setDuration]);

    return <SimpleStoryViewer story={story} />;
}
