import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '../../context/StickerContext';

interface CountdownStickerProps {
    sticker: Sticker;
    textStyle: any;
}

export default function CountdownSticker({ sticker, textStyle }: CountdownStickerProps) {
    const [timeRemaining, setTimeRemaining] = useState('');
    const endTime = sticker.metadata?.endTime;
    const iconColor = textStyle.color || 'white';
    
    useEffect(() => {
        if (!endTime) return;
        
        const updateTimeRemaining = () => {
            const now = new Date();
            const targetDate = new Date(endTime);
            const diff = targetDate.getTime() - now.getTime();
            
            if (diff <= 0) {
                setTimeRemaining("Time's up!");
                return;
            }
            
            // Calculate remaining time
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            // Format the remaining time
            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeRemaining(`${minutes}m ${seconds}s`);
            }
        };
        
        // Update immediately
        updateTimeRemaining();
        
        // Update every second
        const intervalId = setInterval(updateTimeRemaining, 1000);
        
        return () => clearInterval(intervalId);
    }, [endTime]);
    
    return (
        <View style={styles.container}>
            <Ionicons name="timer-outline" size={24} color={iconColor} style={styles.icon} />
            <View style={styles.textContainer}>
                <Animated.Text style={[textStyle, styles.title]}>
                    {sticker.content}
                </Animated.Text>
                <Text style={[styles.countdown, { color: iconColor }]}>
                    {timeRemaining}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    icon: {
        marginRight: 8,
    },
    textContainer: {
        flexDirection: 'column',
    },
    title: {
        marginBottom: 4,
    },
    countdown: {
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 