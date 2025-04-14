import { useAtomValue } from 'jotai';
import React from 'react';

import PostTypeSwitcher from '@/lib/publish/components/composer/post-type-switcher';
import PostScreen from '@/lib/publish/screens/post';
import StoryScreen from '@/lib/publish/screens/story';
import VideoScreen from '@/lib/publish/screens/video';
import { publishPostTypeAtom } from '@/lib/publish/store/editor';

export default function PublishScreen() {
    const postType = useAtomValue(publishPostTypeAtom);

    return (
        <>
            <PostTypeSwitcher />
            {postType === 'post' && <PostScreen />}
            {postType === 'story' && <StoryScreen />}
            {postType === 'video' && <VideoScreen />}
        </>
    );
}
