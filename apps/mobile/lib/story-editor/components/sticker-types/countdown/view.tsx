import React, { useState, useEffect } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '@/lib/story-editor/store/index';
import countdownStyles, { getStyleFromName } from './styles';

interface CountdownStickerViewProps {
    sticker: Sticker;
    onLayout?: (event: LayoutChangeEvent) => void;
}

export default function CountdownStickerView({ sticker, onLayout }: CountdownStickerViewProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Get the selected style or default to the first one if not set
    const selectedStyle = getStyleFromName(sticker.style);

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
                setTimeLeft("Time's up!");
                return;
            }

            // Calculate days, hours, minutes, seconds
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Helper to pad single digit numbers with leading zeros
            const padWithZero = (num: number): string => {
                return num < 10 ? `0${num}` : `${num}`;
            };

            // Format the time left
            if (days > 0) {
                setTimeLeft(`${days}d ${padWithZero(hours)}h ${padWithZero(minutes)}m`);
            } else if (hours > 0) {
                setTimeLeft(`${padWithZero(hours)}:${padWithZero(minutes)}:${padWithZero(seconds)}`);
            } else {
                setTimeLeft(`${padWithZero(minutes)}:${padWithZero(seconds)}`);
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
        <View style={selectedStyle.container} onLayout={onLayout}>
            {/* {showIcon && <Ionicons name="time-outline" size={iconSize} color={iconColor} style={{ marginRight: 6 }} />} */}
            <Text style={selectedStyle.titleText}>
                {sticker.style}
                {sticker.metadata?.title || 'Countdown'}
            </Text>
            <Text style={selectedStyle.countdownText}>{timeLeft}</Text>
        </View>
    );
}

// Helper function to get the next style in the array
export function getNextCountdownStyle(currentStyle?: string): string {
    const index = countdownStyles.findIndex((style) => style.name === currentStyle);
    if (index === -1 || index === countdownStyles.length - 1) {
        return countdownStyles[0].name;
    }
    return countdownStyles[index + 1].name;
}
