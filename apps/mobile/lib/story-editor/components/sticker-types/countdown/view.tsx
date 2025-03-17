import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '@/lib/story-editor/store';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { getStickerStyle } from '@/lib/story-editor/styles/stickerStyles';
import countdownStyles from './styles';

interface CountdownStickerViewProps {
    sticker: Sticker;
}

export default function CountdownStickerView({ sticker }: CountdownStickerViewProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    
    // Get the selected style or default to the first one if not set
    const selectedStyle = getStickerStyle(NDKStoryStickerType.Countdown, sticker.style) || countdownStyles[0];
    
    // Create container styles based on the selected style
    const containerStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: 10,
        backgroundColor: selectedStyle.backgroundColor || 'rgba(0, 0, 0, 0.6)',
        borderRadius: selectedStyle.borderRadius || 16,
        borderWidth: selectedStyle.borderWidth,
        borderColor: selectedStyle.borderColor,
        borderStyle: selectedStyle.borderStyle as any,
        shadowColor: selectedStyle.shadowColor,
        shadowOffset: selectedStyle.shadowOffset,
        shadowOpacity: selectedStyle.shadowOpacity,
        shadowRadius: selectedStyle.shadowRadius,
        elevation: selectedStyle.elevation,
    };
    
    // Create text styles based on the selected style
    const textStyle = {
        color: selectedStyle.color || 'white',
        fontSize: selectedStyle.fontSize || 18,
        fontWeight: selectedStyle.fontWeight || 'bold',
        fontStyle: selectedStyle.fontStyle as any,
        textShadowColor: selectedStyle.textShadowColor,
        textShadowOffset: selectedStyle.textShadowOffset,
        textShadowRadius: selectedStyle.textShadowRadius,
    };
    
    // Icon color from the style
    const iconColor = selectedStyle.iconColor || 'white';
    
    useEffect(() => {
        // Get the end time from the sticker metadata
        const endTime = sticker.metadata?.endTime;
        
        if (!endTime) {
            setTimeLeft('Invalid date');
            return;
        }
        
        // Calculate time left
        const calculateTimeLeft = () => {
            const now = new Date();
            const end = new Date(endTime);
            const diff = end.getTime() - now.getTime();
            
            if (diff <= 0) {
                setTimeLeft('Time\'s up!');
                return;
            }
            
            // Calculate days, hours, minutes, seconds
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            // Format the time left
            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${minutes}m ${seconds}s`);
            }
        };
        
        // Calculate time left immediately
        calculateTimeLeft();
        
        // Update time left every second
        const timer = setInterval(calculateTimeLeft, 1000);
        
        // Clean up timer
        return () => clearInterval(timer);
    }, [sticker.metadata?.endTime]);
    
    return (
        <View style={containerStyle}>
            <Ionicons name="time-outline" size={18} color={iconColor} style={{ marginRight: 6 }} />
            <Text style={textStyle}>
                {sticker.value || 'Countdown'}: {timeLeft}
            </Text>
        </View>
    );
} 