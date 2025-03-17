import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, Text, Dimensions } from 'react-native';
import SimpleStoryViewer from '@/lib/stories/components/SimpleStoryViewer';
import { NDKStory, NDKStoryStickerType, useNDK, useSubscribe } from '@nostr-dev-kit/ndk-mobile';

const screen = Dimensions.get('window');

const mockStory = {
    "kind": 25,
    "id": "85691960b746439d894491c7afeb317e19907431d401026697f77d028cb110f2",
    "pubkey": "d0862635d042008f4832795159c42dd89a89eb4bf0506013b32e6c8c0aaa87a2",
    "created_at": 1742248702,
    "tags": [
        [
            "imeta",
            "url https://blossom.primal.net/9dd468ad82d325afbb8063944a313542c956fecbd8cdef9d6e5e9d5afd03b459.jpg",
            "x 9dd468ad82d325afbb8063944a313542c956fecbd8cdef9d6e5e9d5afd03b459",
            "dim 1535x1024",
            "m image/jpeg",
            "size 499122"
        ],
        [
            "alt",
            "This is a story event created with Olas"
        ],
        [
            "dim",
            "440x956"
        ],
        [
            "sticker",
            "text",
            "Hello world",
            "60.33,55.67",
            "294x147",
            "style Gradient BG"
        ],
        [
            "sticker",
            "text",
            "Hello world",
            "-120.33,355.67",
            "400x100",
            "style Default",
            "rot 10"
        ],
        [
            "client",
            "olas",
            "31990:fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52:1731850618505"
        ]
    ],
    "content": "",
    "sig": "771413225e52c191c4a6781f9723f73805d6acee40ecb2edaecc16bd099e51a011f60c47e2eb896018cd0a33c543882fe4d4764cc7aaeb6996d0e924f999d2da"
};

export default function StoryViewerDemoScreen() {
    const { ndk } = useNDK();
    const story = new NDKStory(ndk, mockStory);
    
    return (
        <SafeAreaView style={styles.container}>
            <SimpleStoryViewer story={story} />
            <View style={styles.helpTextContainer}>
                <Text style={styles.helpText}>
                    Testing NDK Story (kind 25) rendering
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    helpTextContainer: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 50,
    },
    helpText: {
        color: 'white',
        fontSize: 14,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 4,
    }
}); 