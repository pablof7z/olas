import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '@/lib/story-editor/store';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import countdownStyles, { getStyleFromName } from './styles';

interface CountdownStickerViewProps {
    sticker: Sticker;
}

export default function CountdownStickerView({ sticker }: CountdownStickerViewProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    
    // Get the selected style or default to the first one if not set
    const selectedStyle = getStyleFromName(sticker.style);
    
    // Extract container and text styles from the selected style
    const { container, text } = selectedStyle;
    
    // Icon configuration
    const iconSize = container.iconSize || 18;
    const showIcon = container.showIcon !== false;
    const iconColor = text.color || 'white';
    
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
        <View style={selectedStyle.container}>
            {showIcon && <Ionicons name="time-outline" size={iconSize} color={iconColor} style={{ marginRight: 6 }} />}
            <Text style={selectedStyle.text}>
                {sticker.value || 'Countdown'}: {timeLeft}
            </Text>
        </View>
    );
}

// Helper function to get the next style in the array
export function getNextCountdownStyle(currentStyle?: string): string {
    const index = countdownStyles.findIndex(style => style.name === currentStyle);
    if (index === -1 || index === countdownStyles.length - 1) {
        return countdownStyles[0].name;
    }
    return countdownStyles[index + 1].name;
} 