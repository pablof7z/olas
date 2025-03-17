import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Ionicons } from '@expo/vector-icons';
import { stickersSheetRefAtom } from '../atoms/stickersSheet';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';

import {
    TextStickerInput,
    EventStickerInput,
    CountdownStickerInput,
    PromptStickerInput,
    MentionStickerInput
} from './sticker-types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { editStickerAtom } from '../store';

interface StickerOptionProps {
    name: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    type: NDKStoryStickerType;
    description: string;
    gradientColors: [string, string];
}

const STICKER_OPTIONS = [
    {
        name: "Text",
        icon: "text",
        type: NDKStoryStickerType.Text,
        description: "Add a simple text sticker",
        gradientColors: ['#FF7EB3', '#FF758C'] as [string, string]
    },
    {
        name: "Mention",
        icon: "person",
        type: NDKStoryStickerType.Pubkey,
        description: "Tag another user",
        gradientColors: ['#7F7FD5', '#91EAE4'] as [string, string]
    },
    {
        name: "Event",
        icon: "link",
        type: NDKStoryStickerType.Event,
        description: "Link to a Nostr event",
        gradientColors: ['#42E695', '#3BB2B8'] as [string, string]
    },
    {
        name: "Countdown",
        icon: "time",
        type: NDKStoryStickerType.Countdown,
        description: "Add a countdown timer",
        gradientColors: ['#FFB88C', '#DE6262'] as [string, string]
    }
];

function StickerOption({ name, icon, type, description, gradientColors }: StickerOptionProps) {
    const setEditSticker = useSetAtom(editStickerAtom);
    const stickersSheetRef = useAtomValue(stickersSheetRefAtom);

    const onPress = useCallback(() => {
        if (type === NDKStoryStickerType.Text) stickersSheetRef?.current?.dismiss();
        setEditSticker({
            id: '',
            type,
            value: '',
            transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }
        });
    }, [setEditSticker, type]);
    
    return (
        <Pressable
            style={({ pressed }) => [
                styles.optionContainer,
                pressed && styles.optionPressed
            ]}
            onPress={onPress}
            testID={`sticker-option-${name.toLowerCase()}`}
        >
            <BlurView intensity={20} tint="dark" style={styles.optionBlur}>
                <View style={styles.optionInner}>
                    <LinearGradient
                        colors={gradientColors}
                        style={styles.iconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name={icon} size={22} color="white" />
                    </LinearGradient>
                    
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionText}>{name}</Text>
                        <Text style={styles.optionDescription}>{description}</Text>
                    </View>
                </View>
            </BlurView>
        </Pressable>
    );
}

export default function StickersBottomSheet() {
    const sheetRef = useSheetRef();
    const setStickersSheetRef = useSetAtom(stickersSheetRefAtom);
    const insets = useSafeAreaInsets();
    const [editSticker, setEditSticker] = useAtom(editStickerAtom);

    const editStickerType = editSticker?.type;
    
    useEffect(() => {
        setStickersSheetRef(sheetRef);
    }, [sheetRef, setStickersSheetRef]);

    const handleBackToOptions = () => {
        setEditSticker(null);
    };

    const handleStickerAdded = useCallback(() => {
        sheetRef.current?.dismiss();
        setEditSticker(null);
    }, [sheetRef, setEditSticker]);

    const renderSearchHeader = (title: string) => (
        <View style={styles.searchHeaderContainer}>
            <TouchableOpacity 
                onPress={handleBackToOptions} 
                style={styles.backButton}
            >
                <Ionicons name="arrow-back" size={18} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
        </View>
    );
    
    return (
        <Sheet 
            ref={sheetRef} 
            snapPoints={['60%', '80%']}
            backgroundComponent={({ style }) => (
                <BlurView intensity={90} tint="dark" style={[style, styles.sheetBlur]} />
            )}
            handleIndicatorStyle={styles.handleIndicator}
            style={styles.sheet}
        >
            <BottomSheetView 
                style={[
                    styles.container, 
                    { paddingBottom: insets.bottom }
                ]}
            >
                <Text>{editStickerType?.toString()}</Text>
                {!editStickerType && <StickerList />}

                {editStickerType === NDKStoryStickerType.Pubkey && (
                    <>
                        {renderSearchHeader('Mention Someone')}
                        <MentionStickerInput 
                            onStickerAdded={handleStickerAdded}
                        />
                    </>
                )}
                
                {editStickerType === NDKStoryStickerType.Event && (
                    <>
                        {renderSearchHeader('Enter Event ID')}
                        <EventStickerInput 
                            onStickerAdded={handleStickerAdded}
                        />
                    </>
                )}
                
                {editStickerType === NDKStoryStickerType.Countdown && (
                    <>
                        {renderSearchHeader('Create Countdown')}
                        <CountdownStickerInput 
                            onStickerAdded={handleStickerAdded}
                        />
                    </>
                )}
                
                {editStickerType === NDKStoryStickerType.Prompt && (
                    <>
                        {renderSearchHeader('Create Prompt')}
                        <PromptStickerInput 
                            onStickerAdded={handleStickerAdded}
                        />
                    </>
                )}
            </BottomSheetView>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    sheet: {
        borderWidth: 0,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    container: {
        flex: 1,
        padding: 0,
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    sheetBlur: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 0,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
    },
    handleIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        width: 40,
        height: 4,
    },
    headerContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        marginBottom: 8,
    },
    searchHeaderContainer: {
        paddingHorizontal: 24,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.5,
    },
    optionsContainer: {
        flex: 1,
    },
    optionsContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    optionContainer: {
        marginBottom: 10,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 0,
    },
    optionPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    optionBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 0,
    },
    optionInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(35, 36, 48, 0.2)',
        borderWidth: 0,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 0,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    optionDescription: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    backButton: {
        marginRight: 16,
    },
    backButtonGradient: {
        width: 32,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 16,
        textAlign: 'center',
    },
});

function StickerList() {
    return (
        <BottomSheetScrollView
            style={styles.optionsContainer}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Add Sticker</Text>
            </View>
            
            {STICKER_OPTIONS.map((option, index) => (
                <StickerOption
                    key={option.name}
                    name={option.name}
                    icon={option.icon as React.ComponentProps<typeof Ionicons>['name']}
                    type={option.type}
                    description={option.description}
                    gradientColors={option.gradientColors}
                />
            ))}
        </BottomSheetScrollView>
    )
}