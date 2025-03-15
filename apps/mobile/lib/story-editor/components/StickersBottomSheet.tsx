import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { BottomSheetModal, BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSetAtom } from 'jotai';
import { Ionicons } from '@expo/vector-icons';
import { stickersSheetRefAtom } from '../atoms/stickersSheet';
import { useStickers } from '../context/StickerContext';
import MentionSuggestions from '@/lib/comments/components/mention-suggestions';
import { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { FlashList } from '@shopify/flash-list';

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

type StickerSelectionMode = 'options' | 'mention' | 'event';

interface EventItem {
    id: string;
    title: string;
}

// Only keep mock data for events, we'll use real data for users
const MOCK_EVENTS: EventItem[] = [
    { id: 'note1event1', title: 'Latest update about my project' },
    { id: 'note1event2', title: 'Thoughts on the new Nostr protocol' },
    { id: 'note1event3', title: 'Check out this amazing post' },
];

export default function StickersBottomSheet() {
    const sheetRef = useSheetRef();
    const setBottomSheetRef = useSetAtom(stickersSheetRefAtom);
    const insets = useSafeAreaInsets();
    const { addMentionSticker, addNostrEventSticker } = useStickers();
    const [mode, setMode] = useState<StickerSelectionMode>('options');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Only keep events state, users will come from MentionSuggestions
    const [events, setEvents] = useState<EventItem[]>(MOCK_EVENTS);

    useEffect(() => {
        setBottomSheetRef(sheetRef);
    }, [sheetRef, setBottomSheetRef]);

    const handleMentionSelect = () => {
        setMode('mention');
        setSearchQuery('@');
    };

    const handleEventSelect = () => {
        setMode('event');
        setSearchQuery('');
    };
    
    const handleBackToOptions = () => {
        setMode('options');
        setSearchQuery('');
    };
    
    const handleSearch = (text: string) => {
        setSearchQuery(text);
        setLoading(true);
        
        // Only handle event search here
        if (mode === 'event') {
            // Simulate search delay
            setTimeout(() => {
                const filtered = MOCK_EVENTS.filter(event => 
                    event.title.toLowerCase().includes(text.toLowerCase()));
                setEvents(filtered);
                setLoading(false);
            }, 300);
        } else {
            // For mentions, we don't need to do anything here
            // as MentionSuggestions handles its own data fetching
            setLoading(false);
        }
    };
    
    const selectUser = (profile: NDKUserProfile) => {
        // Use the real NDKUserProfile
        addMentionSticker(profile);
        sheetRef.current?.dismiss();
        setMode('options');
    };
    
    const selectEvent = (event: EventItem) => {
        addNostrEventSticker(event.id, event.title);
        sheetRef.current?.dismiss();
        setMode('options');
    };

    const renderOptions = () => (
        <>
            <View style={styles.headerContainer}>
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>
                <Text style={styles.title}>Add Sticker</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.optionsContainer}>
                <StickerOption 
                    name="Mention" 
                    icon="person-circle" 
                    onPress={handleMentionSelect}
                    description="Tag a Nostr user in your story"
                />
                <StickerOption 
                    name="Nostr Event" 
                    icon="document-text" 
                    onPress={handleEventSelect}
                    description="Link to a Nostr post or note"
                />
            </View>
        </>
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
            
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    {mode === 'mention' && (
                        <Ionicons name="at" size={20} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
                    )}
                    {mode === 'event' && (
                        <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
                    )}
                    <TextInput
                        style={styles.searchInput}
                        placeholder={mode === 'mention' ? "@username" : "Search events..."}
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoFocus
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > (mode === 'mention' ? 1 : 0) && (
                        <TouchableOpacity onPress={() => handleSearch(mode === 'mention' ? '@' : '')}>
                            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </>
    );
    
    const renderMentionList = () => (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {loading ? (
                <ActivityIndicator color="white" style={styles.loader} />
            ) : (
                <MentionSuggestions
                    query={searchQuery}
                    onPress={selectUser}
                    FlashListComponent={FlashList}
                />
            )}
        </View>
    );
    
    const renderEventList = () => (
        <BottomSheetScrollView contentContainerStyle={styles.listContainer}>
            {loading ? (
                <ActivityIndicator color="white" style={styles.loader} />
            ) : events.length === 0 ? (
                <Text style={styles.emptyMessage}>No events found</Text>
            ) : (
                events.map(event => (
                    <TouchableOpacity 
                        key={event.id} 
                        style={styles.listItem}
                        onPress={() => selectEvent(event)}
                    >
                        <View style={[styles.iconContainer, styles.eventIcon]}>
                            <Ionicons name="document-text" size={20} color="white" />
                        </View>
                        <View style={styles.listItemTextContainer}>
                            <Text style={styles.listItemTitle}>{event.title}</Text>
                            <Text style={styles.listItemSubtitle}>{event.id.substring(0, 12)}...</Text>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </BottomSheetScrollView>
    );
    
    const getSnapPoints = () => {
        if (mode === 'options') return ['45%'];
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
                {mode === 'mention' && (
                    <>
                        {renderSearchHeader('Select User')}
                        {renderMentionList()}
                    </>
                )}
                {mode === 'event' && (
                    <>
                        {renderSearchHeader('Select Event')}
                        {renderEventList()}
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
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        padding: 4,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
    },
    userIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(100, 100, 100, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    eventIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
    },
    userInitial: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    listItemTextContainer: {
        flex: 1,
    },
    listItemTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    listItemSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    loader: {
        marginTop: 20,
    },
    emptyMessage: {
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
}); 