import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import { NDKEvent, NDKStory, useNDK } from '@nostr-dev-kit/ndk-mobile';
import SimpleStoryViewer from './SimpleStoryViewer';
import { storiesAtom } from '../store';
import { useAtomValue } from 'jotai';

export default function StoryViewerDemo() {
    const { ndk } = useNDK();
    const stories = useAtomValue(storiesAtom);
    const [storyIndex, setStoryIndex] = useState(0);
    const [storyEvents, setStoryEvents] = useState<NDKStory[]>([]);
    
    // Extract kind 25 (NDKStory) events from stories
    useEffect(() => {
        if (!stories || stories.length === 0 || !ndk) return;
        
        // Filter for kind 25 (NDKStory) events and cast them to NDKStory
        const ndkStories = stories
            .filter(event => event.kind === 25)
            .map(event => {
                // Convert NDKEvent to NDKStory
                const ndkStory = new NDKStory(ndk);
                Object.assign(ndkStory, event);
                return ndkStory;
            });
            
        setStoryEvents(ndkStories);
    }, [stories, ndk]);
    
    const handleNext = () => {
        if (storyIndex < storyEvents.length - 1) {
            setStoryIndex(storyIndex + 1);
        }
    };
    
    const handlePrev = () => {
        if (storyIndex > 0) {
            setStoryIndex(storyIndex - 1);
        }
    };
    
    if (storyEvents.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.noStoriesText}>No story events available</Text>
                <Text style={styles.instructionText}>
                    Create a story first by going to the story editor
                </Text>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            <SimpleStoryViewer 
                story={storyEvents[storyIndex]} 
                onNext={handleNext}
                onPrev={handlePrev}
            />
            <View style={styles.controls}>
                <Text style={styles.indexText}>
                    {storyIndex + 1} / {storyEvents.length}
                </Text>
                <View style={styles.buttons}>
                    <Button 
                        title="Previous" 
                        onPress={handlePrev} 
                        disabled={storyIndex === 0}
                    />
                    <Button 
                        title="Next" 
                        onPress={handleNext} 
                        disabled={storyIndex === storyEvents.length - 1}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#000',
    },
    controls: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flexDirection: 'column',
        alignItems: 'center',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '60%',
        marginTop: 10,
    },
    indexText: {
        color: 'white',
        fontSize: 16,
        marginBottom: 10,
    },
    noStoriesText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 100,
    },
    instructionText: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 20,
    }
}); 