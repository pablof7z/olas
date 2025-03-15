import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getCountdownStickerStyleById } from '../../styles/countdownStickerStyles';
import { useEventStartTime, useEventCountdown } from '../../contexts/EventContext';
import { Sticker as StickerType } from '../../context/StickerContext';

interface CountdownStickerProps {
    sticker: StickerType;
}

export default function CountdownSticker({ sticker }: CountdownStickerProps) {
    const { eventStartTime, displayOption, dateString } = useEventStartTime();
    const style = getCountdownStickerStyleById(sticker.styleId);
    const countdown = useEventCountdown(eventStartTime);

    // Extract layout options or use defaults
    const layout = style.layout || {
        direction: 'column' as const,
        iconSize: 24,
        showIcon: true,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: 8
    };

    if (style.style.gradient) {
        return (
            <LinearGradient
                colors={style.style.gradient.colors}
                start={style.style.gradient.start || { x: 0, y: 0 }}
                end={style.style.gradient.end || { x: 1, y: 1 }}
                style={style.style.container}
            >
                <View
                    style={{
                        flexDirection: layout.direction,
                        alignItems: layout.alignItems,
                        justifyContent: layout.justifyContent,
                        gap: layout.gap,
                    }}
                >
                    {layout.showIcon && (
                        <MaterialCommunityIcons
                            name="clock-outline"
                            size={layout.iconSize}
                            color={style.style.text.color}
                        />
                    )}
                    <View>
                        <Text allowFontScaling={false} style={[style.style.text, style.fontFamily ? { fontFamily: style.fontFamily } : {}]}>
                            {displayOption === 'countdown' ? countdown : dateString}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        );
    }

    return (
        <View style={style.style.container}>
            <View
                style={{
                    flexDirection: layout.direction,
                    alignItems: layout.alignItems,
                    justifyContent: layout.justifyContent,
                    gap: layout.gap,
                }}
            >
                {layout.showIcon && (
                    <MaterialCommunityIcons
                        name="clock-outline"
                        size={layout.iconSize}
                        color={style.style.text.color}
                    />
                )}
                <View>
                    <Text allowFontScaling={false} style={[style.style.text, style.fontFamily ? { fontFamily: style.fontFamily } : {}]}>
                        {displayOption === 'countdown' ? countdown : dateString}
                    </Text>
                </View>
            </View>
        </View>
    );
} 