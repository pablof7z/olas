import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CountdownStickerInputProps {
    onStickerAdded: () => void;
    addCountdownSticker: (name: string, endTime: Date) => string;
}

export default function CountdownStickerInput({ onStickerAdded, addCountdownSticker }: CountdownStickerInputProps) {
    const [countdownName, setCountdownName] = useState('');
    const [countdownDate, setCountdownDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const { colors } = useColorScheme();

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
        
        // Preserve the date from the current countdownDate
        const newDate = new Date(countdownDate);
        if (selectedTime) {
            newDate.setHours(currentTime.getHours());
            newDate.setMinutes(currentTime.getMinutes());
        }
        
        setCountdownDate(newDate);
    };

    const handleAddCountdownSticker = () => {
        if (countdownName.trim()) {
            addCountdownSticker(countdownName, countdownDate);
            onStickerAdded();
        }
    };

    return (
        <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>Name your countdown:</Text>
            <TextInput
                style={[styles.countdownInput, { color: colors.foreground }]}
                placeholder="Countdown Name"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={countdownName}
                onChangeText={setCountdownName}
                autoFocus
            />
            
            <Text style={[styles.countdownLabel, { marginTop: 16 }]}>Select date & time:</Text>
            
            <View style={styles.datePickerRow}>
                <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Ionicons name="calendar-outline" size={20} color="white" style={styles.datePickerIcon} />
                    <Text style={styles.datePickerText}>
                        {countdownDate.toLocaleDateString()}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.timePickerButton}
                    onPress={() => setShowTimePicker(true)}
                >
                    <Ionicons name="time-outline" size={20} color="white" style={styles.datePickerIcon} />
                    <Text style={styles.datePickerText}>
                        {countdownDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </TouchableOpacity>
            </View>
            
            {showDatePicker && (
                <DateTimePicker
                    value={countdownDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}
            
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
}

const styles = StyleSheet.create({
    countdownContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    countdownLabel: {
        color: 'white',
        fontSize: 16,
        marginBottom: 12,
    },
    countdownInput: {
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
        borderRadius: 10,
        padding: 12,
        color: 'white',
        fontSize: 16,
    },
    datePickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    datePickerButton: {
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
    },
    timePickerButton: {
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
    },
    datePickerIcon: {
        marginRight: 8,
    },
    datePickerText: {
        color: 'white',
        fontSize: 16,
    },
    addEventButton: {
        backgroundColor: '#0ea5e9', // blue
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    addEventButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 