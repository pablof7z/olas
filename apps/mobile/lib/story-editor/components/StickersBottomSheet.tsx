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
import { useColorScheme } from '@/lib/useColorScheme';
import DateTimePicker from '@react-native-community/datetimepicker';

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

type StickerSelectionMode = 'options' | 'mention' | 'event' | 'countdown';

interface EventItem {
    id: string;
    title: string;
}

// Remove mock events since we'll use direct input instead

export default function StickersBottomSheet() {
    const sheetRef = useSheetRef();
    const setBottomSheetRef = useSetAtom(stickersSheetRefAtom);
    const insets = useSafeAreaInsets();
    const { addMentionSticker, addNostrEventSticker, addCountdownSticker } = useStickers();
    const [mode, setMode] = useState<StickerSelectionMode>('options');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Replace events array with a single event ID input
    const [eventIdInput, setEventIdInput] = useState('');
    
    // Countdown sticker state
    const [countdownName, setCountdownName] = useState('');
    const [countdownDate, setCountdownDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        setBottomSheetRef(sheetRef);
    }, [sheetRef, setBottomSheetRef]);

    const handleMentionSelect = () => {
        setMode('mention');
        setSearchQuery('@');
    };

    const handleEventSelect = () => {
        setMode('event');
        setEventIdInput('');
    };
    
    const handleCountdownSelect = () => {
        setMode('countdown');
        setCountdownName('');
        setCountdownDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default to tomorrow
    };
    
    const handleBackToOptions = () => {
        setMode('options');
        setSearchQuery('');
        setEventIdInput('');
        setCountdownName('');
    };
    
    const handleSearch = (text: string) => {
        setSearchQuery(text);
        setLoading(true);
        
        // Only handle mention search, we don't search for events anymore
        if (mode === 'mention') {
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

    const { colors } = useColorScheme();
    
    const handleEventIdChange = (text: string) => {
        setEventIdInput(text);
    };
    
    const handleAddEventSticker = () => {
        if (eventIdInput.trim()) {
            const id = eventIdInput.trim();
            const title = `Event: ${id.substring(0, 8)}...`;
            addNostrEventSticker(id, title);
            sheetRef.current?.dismiss();
            setMode('options');
        }
    };

    const handleAddCountdownSticker = () => {
        if (countdownName.trim()) {
            addCountdownSticker(countdownName, countdownDate);
            sheetRef.current?.dismiss();
            setMode('options');
        }
    };
    
    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || countdownDate;
        setShowDatePicker(false);
        
        // Preserve the time from the current countdownDate
        const newDate = new Date(currentDate);
        newDate.setHours(countdownDate.getHours());
        newDate.setMinutes(countdownDate.getMinutes());
        
        setCountdownDate(newDate);
    };
    
    const onTimeChange = (event: any, selectedTime?: Date) => {
        const currentTime = selectedTime || countdownDate;
        setShowTimePicker(false);
        
        // Preserve the date but update the time
        const newDate = new Date(countdownDate);
        newDate.setHours(currentTime.getHours());
        newDate.setMinutes(currentTime.getMinutes());
        
        setCountdownDate(newDate);
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
                <StickerOption 
                    name="Countdown" 
                    icon="timer-outline" 
                    onPress={handleCountdownSelect}
                    description="Add a countdown timer to your story"
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
                    {mode === 'mention' && (
                        <TextInput
                            style={styles.searchInput}
                            placeholder="@username"
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            value={searchQuery}
                            onChangeText={handleSearch}
                            autoFocus
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    )}
                    {mode === 'mention' && searchQuery.length > 1 && (
                        <TouchableOpacity onPress={() => handleSearch('@')}>
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
        <View style={styles.eventInputContainer}>
            <Text style={styles.eventInputLabel}>Enter Nostr Event ID:</Text>
            <TextInput
                style={[styles.eventInput, { color: colors.foreground }]}
                placeholder="Event ID"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={eventIdInput}
                onChangeText={handleEventIdChange}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TouchableOpacity 
                style={[
                    styles.addEventButton,
                    { opacity: eventIdInput.trim() ? 1 : 0.5 }
                ]}
                onPress={handleAddEventSticker}
                disabled={!eventIdInput.trim()}
            >
                <Text style={styles.addEventButtonText}>Done</Text>
            </TouchableOpacity>
        </View>
    );
    
    const renderCountdownSetup = () => (
        <View style={styles.countdownContainer}>
            <Text style={styles.eventInputLabel}>Countdown Name:</Text>
            <TextInput
                style={[styles.eventInput, { color: colors.foreground }]}
                placeholder="Enter name for countdown"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={countdownName}
                onChangeText={setCountdownName}
                autoFocus
                autoCapitalize="sentences"
            />
            
            <Text style={[styles.eventInputLabel, { marginTop: 16 }]}>End Date:</Text>
            <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={styles.datePickerText}>
                    {countdownDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="white" />
            </TouchableOpacity>
            
            {showDatePicker && (
                <DateTimePicker
                    value={countdownDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                />
            )}
            
            <Text style={[styles.eventInputLabel, { marginTop: 16 }]}>End Time:</Text>
            <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowTimePicker(true)}
            >
                <Text style={styles.datePickerText}>
                    {countdownDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name="time-outline" size={20} color="white" />
            </TouchableOpacity>
            
            {showTimePicker && (
                <DateTimePicker
                    value={countdownDate}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                />
            )}
            
            <TouchableOpacity 
                style={[
                    styles.addEventButton,
                    { opacity: countdownName.trim() ? 1 : 0.5, marginTop: 24 }
                ]}
                onPress={handleAddCountdownSticker}
                disabled={!countdownName.trim()}
            >
                <Text style={styles.addEventButtonText}>Add Countdown</Text>
            </TouchableOpacity>
        </View>
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
                        {renderSearchHeader('Enter Event ID')}
                        {renderEventList()}
                    </>
                )}
                {mode === 'countdown' && (
                    <>
                        {renderSearchHeader('Create Countdown')}
                        {renderCountdownSetup()}
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
    eventInputContainer: {
        padding: 16,
    },
    eventInputLabel: {
        color: 'white',
        fontSize: 16,
        marginBottom: 8,
    },
    eventInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        marginBottom: 16,
    },
    addEventButton: {
        backgroundColor: '#5b21b6',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    addEventButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 20,
    },
    countdownContainer: {
        padding: 16,
    },
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 12,
    },
    datePickerText: {
        color: 'white',
        fontSize: 16,
    },
}); 