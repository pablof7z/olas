import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '@/lib/story-editor/context/StickerContext';

interface CountdownStickerViewProps {
    sticker: Sticker;
}

export default function CountdownStickerView({ sticker }: CountdownStickerViewProps) {
    const [timeLeft, setTimeLeft] = useState('');
    const endTime = sticker.metadata?.endTime;

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!endTime) return '';
            
            const now = new Date();
            const targetDate = new Date(endTime);
            const difference = targetDate.getTime() - now.getTime();
            
            if (difference <= 0) {
                return 'Ended';
            }
            
            // Calculate days, hours, minutes
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            
            // Format the time left
            if (days > 0) {
                return `${days}d ${hours}h ${minutes}m`;
            } else if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else {
                return `${minutes}m`;
            }
        };
        
        // Set initial time
        setTimeLeft(calculateTimeLeft());
        
        // Update time every minute
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000);
        
        return () => clearInterval(timer);
    }, [endTime]);
    
    return (
        <View style={styles.container}>
            <Ionicons name="time" size={18} color="white" style={styles.icon} />
            <View>
                <Text style={styles.title}>{sticker.content}</Text>
                <Text style={styles.timeLeft}>{timeLeft}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 16,
    },
    icon: {
        marginRight: 10,
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    timeLeft: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
    },
}); 