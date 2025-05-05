import { Canvas, Circle, Rect, SweepGradient, vec } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const flareLabelMap = {
    live: 'LIVE',
    olas365: '#365',
    story_prompt: 'Add',
};

export default function FlareLabel({ flare, pubkey }: { flare: string; pubkey: string }) {
    const handleFlarePress = useCallback(() => {
        if (flare === 'olas365') {
            router.push(`/365?pubkey=${pubkey}`);
            // router.push(`/profile?pubkey=${pubkey}&view=olas365`);
        }
    }, [flare]);

    return (
        <View>
            <FlareElement flare={flare} size={48} />

            <Pressable onPress={handleFlarePress}>
                <Text style={styles.flareLabel}>
                    {flareLabelMap[flare as keyof typeof flareLabelMap] ?? flare}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 4,
        overflow: 'hidden',
    },
    flareLabel: {
        fontSize: 11,
        fontWeight: '600',
        paddingHorizontal: 4,
        paddingVertical: 2,
        color: 'white',
    },
});

export const FlareElement = ({
    flare,
    size,
    borderWidth,
}: { flare: string; size: number; borderWidth?: number }) => {
    if (flare === 'live') {
        return <LiveFlare />;
    } else if (flare === 'olas365') {
        return <OlasFlare size={size} borderWidth={borderWidth} />;
    } else if (flare === 'story_prompt') {
        return <StoryPromptFlare size={size} />;
    }
    return null;
};

export const LiveFlare = memo(() => {
    return (
        <View
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'red',
                overflow: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
        />
    );
});

export const StoryPromptFlare = memo(({ size }: { size: number }) => {
    return (
        <Canvas style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Rect x={0} y={0} width={size} height={size}>
                <SweepGradient
                    c={vec(size / 2, size / 2)}
                    colors={['#999999', '#cccccc', '#999999']}
                />
            </Rect>
        </Canvas>
    );
});

export const OlasFlare = ({ size, borderWidth }: { size: number; borderWidth?: number }) => {
    // return <View style={{ width: size, height: size, overflow: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'blue' }} />
    return (
        <Canvas style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {borderWidth ? (
                // Hollow Circle (stroke only)
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={size / 2 - borderWidth / 2}
                    style="stroke"
                    strokeWidth={borderWidth}
                >
                    <SweepGradient
                        c={vec(size / 2, size / 2)}
                        colors={['#112FED', 'cyan', '#112FED']}
                    />
                </Circle>
            ) : (
                <Rect x={0} y={0} width={size} height={size}>
                    <SweepGradient
                        c={vec(size / 2, size / 2)}
                        colors={['#112FED', 'cyan', '#112FED']}
                    />
                </Rect>
            )}
        </Canvas>
    );
};