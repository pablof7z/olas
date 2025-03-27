import type { NDKStory } from '@nostr-dev-kit/ndk-mobile';

import SimpleStoryViewer from '../components/StoryViewer';

// Default duration for stories (in seconds)
const DEFAULT_DURATION = 8;

interface SlideStoryProps {
    story: NDKStory;
    isActiveSlide: boolean;
    onContentLoaded: (duration: number) => void;
}

export function SlideStory({ story, isActiveSlide, onContentLoaded }: SlideStoryProps) {
    return (
        <SimpleStoryViewer
            story={story}
            isActive={isActiveSlide}
            onMediaLoaded={() => {
                // This will be called when the image or video is loaded in SimpleStoryViewer
                // No need to call onContentLoaded again here as we already did in useEffect
                const durationInSeconds = story.duration ? story.duration : DEFAULT_DURATION;
                onContentLoaded(durationInSeconds * 1000);
            }}
        />
    );
}
