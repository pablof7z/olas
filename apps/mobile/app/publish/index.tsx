import PostTypeSwitcher from '@/lib/publish/components/composer/post-type-switcher';

import React from 'react';
import { publishPostTypeAtom } from '@/lib/publish/store/editor';
import { useAtomValue } from 'jotai';
import StoryScreen from '@/lib/publish/screens/story';
import PostScreen from '@/lib/publish/screens/post';

export default function PublishScreen() {
    const postType = useAtomValue(publishPostTypeAtom);

    return (
        <>
            <PostTypeSwitcher />
            {postType === 'post' && <PostScreen />}
            {postType === 'story' && <StoryScreen />}
        </>
    );
}
