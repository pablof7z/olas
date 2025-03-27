import type { NDKStory } from '@nostr-dev-kit/ndk-mobile';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { View } from 'react-native';

import SimpleStoryViewer from '../components/StoryViewer';
import { durationAtom, isLoadingAtom } from './store';

export function SlideStory({ story }: { story: NDKStory }) {
    const setIsLoading = useSetAtom(isLoadingAtom);
    const setDuration = useSetAtom(durationAtom);

    useEffect(() => {
        setIsLoading(false);
        setDuration(8000); // Default duration for stories
    }, [story, setIsLoading, setDuration]);

    return <SimpleStoryViewer story={story} />;
}
