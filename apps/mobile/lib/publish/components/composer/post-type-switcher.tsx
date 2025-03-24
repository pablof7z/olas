import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useCallback } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { publishPostTypeAtom } from "@/lib/publish/store/editor";
import { useAtom } from "jotai";
import Animated from "react-native-reanimated";

export const POST_TYPE_SWITCHER_HEIGHT = 50;

export default function PostTypeSwitcher() {
    const [postType, setPostType] = useAtom(publishPostTypeAtom);

    const handleStoryPress = useCallback(() => {
        setPostType('story');
    }, []);

    const handlePostPress = useCallback(() => {
        setPostType('post');
    }, []);

    const handleVideoPress = useCallback(() => {
        setPostType('video');
    }, []);

    const insets = useSafeAreaInsets();
    
    return (<View style={[postTypeSwitcherStyles.positioner, { marginBottom: insets.bottom }]}>
        <BlurView intensity={80} tint="dark" style={{ borderRadius: POST_TYPE_SWITCHER_HEIGHT, overflow: 'hidden' }}>
            <View style={postTypeSwitcherStyles.container}>
                <Pressable style={postTypeSwitcherStyles.button} onPress={handlePostPress}>
                    <Animated.Text 
                        style={[
                            postTypeSwitcherStyles.buttonText, 
                            { 
                                color: postType === 'post' ? 'white' : '#ffffff88',
                                fontWeight: 'bold',
                            }
                        ]}
                        transition={{ type: 'timing', duration: 200 }}
                    >
                        POST
                    </Animated.Text>
                </Pressable>
                <Pressable style={postTypeSwitcherStyles.button} onPress={handleStoryPress}>
                    <Animated.Text 
                        style={[
                            postTypeSwitcherStyles.buttonText, 
                            { 
                                color: postType === 'story' ? 'white' : '#ffffff88',
                                fontWeight: 'bold',
                            }
                        ]}
                        transition={{ type: 'timing', duration: 200 }}
                    >
                        STORY
                    </Animated.Text>
                </Pressable>
                <Pressable style={postTypeSwitcherStyles.button} onPress={handleVideoPress}>
                    <Animated.Text 
                        style={[
                            postTypeSwitcherStyles.buttonText, 
                            { 
                                color: postType === 'video' ? 'white' : '#ffffff88',
                                fontWeight: 'bold',
                            }
                        ]}
                        transition={{ type: 'timing', duration: 200 }}
                    >
                        VIDEO
                    </Animated.Text>
                </Pressable>
            </View>
        </BlurView>
    </View>)
}

const postTypeSwitcherStyles = StyleSheet.create({
    positioner: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        height: POST_TYPE_SWITCHER_HEIGHT,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        padding: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    buttonText: {
        color: '#ffffff88',
        fontSize: 14,
        fontWeight: 'bold'
    },
    activeButtonText: {
        color: 'white'
    }
})
