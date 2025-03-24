import { View, ScrollView, Dimensions, StyleSheet, Pressable, TouchableOpacity, FlatList } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Text } from "react-native";
import { useEditorStore } from "@/lib/publish/store/editor";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";
import { X } from "lucide-react-native";
import { useCallback } from "react";

function HeaderLeft() {
    const handlePress = useCallback(() => {
        router.back();
    }, []);
    
    return (
        <Pressable onPress={handlePress}>
            <X color="white" />
        </Pressable>
    );
}

function HeaderRight() {
    const handlePress = useCallback(() => {
        router.push('/publish/post/metadata');
    }, []);
    
    return (
        <TouchableOpacity onPress={handlePress}>
            <Text style={headerStyles.title}>Next</Text>
        </TouchableOpacity>
    );
}

const dimensions = Dimensions.get('window');

export default function PostEditScreen() {
    const { selectedMedia } = useEditorStore();
    const previewHeight = dimensions.height * 0.6;

    const headerHeight = useHeaderHeight();

    return (
        <>
            <Stack.Screen options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: 'Edit',
                headerStyle: {
                    backgroundColor: 'black',
                },
                headerTitleStyle: {
                    color: 'white'
                },
                headerLeft: () => <HeaderLeft />,
                headerRight: () => <HeaderRight />
            }} />
            <View style={[styles.container, { paddingTop: headerHeight }]}>
                <View style={[styles.previewContainer, { height: previewHeight }]}>
                    <ScrollView 
                        horizontal 
                        pagingEnabled 
                        showsHorizontalScrollIndicator={false}
                    >
                        {selectedMedia.map((item) => (
                            <View key={item.id} style={[styles.mediaContainer, { width: dimensions.width, height: previewHeight }]}>
                                <Image
                                    source={{ uri: item.uris[0] }}
                                    style={[styles.mediaPreview, { flex: 1, width: '100%', minHeight: previewHeight }]}
                                    contentFit="contain"
                                />
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.bottomActions}>
                    <Pressable style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Filters</Text>
                    </Pressable>
                </View>
            </View>
        </>
    );
}

const headerStyles = StyleSheet.create({
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white'
    }
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewContainer: {
        width: '100%',
    },
    scrollContent: {
    },
    mediaContainer: {
        aspectRatio: 1,

    },
    mediaPreview: {
        width: '100%',
    },
    emptyState: {
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
    },
    emptyStateText: {
        color: '#666',
        fontSize: 16,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});