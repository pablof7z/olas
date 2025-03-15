import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSetAtom } from 'jotai';
import { Ionicons } from '@expo/vector-icons';
import { stickersSheetRefAtom } from '../atoms/stickersSheet';
import { useStickers } from '../context/StickerContext';
import {
    TextStickerInput,
    MentionStickerInput,
    EventStickerInput,
    CountdownStickerInput,
    NostrFilterStickerInput,
    PromptStickerInput,
} from './story-type';

interface StickerOptionProps {
    name: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
    description: string;
}

function StickerOption({ name, icon, onPress, description }: StickerOptionProps) {
    return (
        <TouchableOpacity
            style={styles.optionContainer}
            onPress={onPress}
            testID={`sticker-option-${name.toLowerCase()}`}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={28} color="white" />
            </View>
            <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>{name}</Text>
                <Text style={styles.optionDescription}>{description}</Text>
            </View>
        </TouchableOpacity>
    );
}

type StickerSelectionMode = 'options' | 'mention' | 'event' | 'countdown' | 'nostrFilter' | 'text' | 'prompt';

export default function StickersBottomSheet() {
    const sheetRef = useSheetRef();
    const setStickersSheetRef = useSetAtom(stickersSheetRefAtom);
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState<StickerSelectionMode>('options');
    const { 
        addTextSticker, 
        addMentionSticker, 
        addNostrEventSticker, 
        addCountdownSticker,
        addNostrFilterSticker,
        addPromptSticker
    } = useStickers();

    useEffect(() => {
        setStickersSheetRef(sheetRef);
    }, [sheetRef, setStickersSheetRef]);

    const handleBackToOptions = () => {
        setMode('options');
    };

    const handleStickerAdded = useCallback(() => {
        sheetRef.current?.dismiss();
        setMode('options');
    }, [sheetRef]);

    const renderOptions = () => (
        <BottomSheetScrollView style={styles.optionsContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.title}>Add Sticker</Text>
            </View>
            <View style={styles.divider} />
            <StickerOption
                name="Text"
                icon="text"
                onPress={() => setMode('text')}
                description="Add a simple text sticker"
            />
            <StickerOption
                name="Mention"
                icon="person"
                onPress={() => setMode('mention')}
                description="Tag another user"
            />
            <StickerOption
                name="Event"
                icon="link"
                onPress={() => setMode('event')}
                description="Link to a Nostr event"
            />
            <StickerOption
                name="Countdown"
                icon="time"
                onPress={() => setMode('countdown')}
                description="Add a countdown timer"
            />
            <StickerOption
                name="Nostr Filter"
                icon="filter"
                onPress={() => setMode('nostrFilter')}
                description="Add a Nostr filter"
            />
            <StickerOption
                name="Prompt"
                icon="chatbubble-outline"
                onPress={() => setMode('prompt')}
                description="Add an interactive question or prompt"
            />
        </BottomSheetScrollView>
    );

    const renderSearchHeader = (title: string) => (
        <>
            <View style={styles.searchHeaderContainer}>
                <TouchableOpacity onPress={handleBackToOptions} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>{title}</Text>
            </View>
            
            <View style={styles.divider} />
        </>
    );
    
    const getSnapPoints = () => {
        if (mode === 'options') return ['45%'];
        if (mode === 'nostrFilter') return ['75%'];
        if (mode === 'prompt') return ['60%'];
        return ['75%'];
    };

    return (
        <Sheet ref={sheetRef} snapPoints={getSnapPoints()}>
            <BottomSheetView 
                style={[
                    styles.container, 
                    { paddingBottom: insets.bottom }
                ]}
            >
                {mode === 'options' && renderOptions()}
                
                {mode === 'text' && (
                    <>
                        {renderSearchHeader('Add Text')}
                        <TextStickerInput 
                            onStickerAdded={handleStickerAdded}
                            addTextSticker={addTextSticker}
                        />
                    </>
                )}
                
                {mode === 'mention' && (
                    <>
                        {renderSearchHeader('Select User')}
                        <MentionStickerInput 
                            onStickerAdded={handleStickerAdded} 
                            addMentionSticker={addMentionSticker}
                        />
                    </>
                )}
                
                {mode === 'event' && (
                    <>
                        {renderSearchHeader('Enter Event ID')}
                        <EventStickerInput 
                            onStickerAdded={handleStickerAdded}
                            addNostrEventSticker={addNostrEventSticker}
                        />
                    </>
                )}
                
                {mode === 'countdown' && (
                    <>
                        {renderSearchHeader('Create Countdown')}
                        <CountdownStickerInput 
                            onStickerAdded={handleStickerAdded}
                            addCountdownSticker={addCountdownSticker}
                        />
                    </>
                )}
                
                {mode === 'nostrFilter' && (
                    <>
                        {renderSearchHeader('Create Nostr Filter')}
                        <NostrFilterStickerInput 
                            onStickerAdded={handleStickerAdded}
                            addNostrFilterSticker={addNostrFilterSticker}
                        />
                    </>
                )}
                
                {mode === 'prompt' && (
                    <>
                        {renderSearchHeader('Create Prompt')}
                        <PromptStickerInput 
                            onStickerAdded={handleStickerAdded}
                            addPromptSticker={addPromptSticker}
                        />
                    </>
                )}
            </BottomSheetView>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 0,
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    searchHeaderContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    handleContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#aaa',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 16,
    },
    optionsContainer: {
        paddingHorizontal: 16,
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(80, 80, 80, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    optionDescription: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    backButton: {
        marginRight: 16,
    },
}); 