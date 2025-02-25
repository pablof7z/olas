import { Rect, SweepGradient, vec } from "@shopify/react-native-skia";
import { Canvas } from "@shopify/react-native-skia";
import { router } from "expo-router";
import { memo, useCallback } from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";

export default function FlareLabel({ flare, pubkey }: { flare: string, pubkey: string }) {
    const handleFlarePress = useCallback(() => {
        if (flare === 'olas365') {
            router.push(`/365?pubkey=${pubkey}`);
        }
    }, [flare]);

    return (
        <View className="w-fit" style={styles.container}>
            <FlareElement flare={flare} size={48} />
            
            <Pressable onPress={handleFlarePress}>
                <Text style={styles.flareLabel}>{flareLabelMap[flare]}</Text>
            </Pressable>
        </View>
    )
} 

const flareLabelMap = {
    live: 'LIVE',
    olas365: '#365',
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 4,
        overflow: 'hidden',
    },
    flareLabel: {
        fontSize: 11,
        fontWeight: 600,
        paddingHorizontal: 4,
        paddingVertical: 2,
        color: 'white',
    }
})

export const FlareElement = memo(({ flare, size }: { flare: string, size: number }) => {
    if (flare === 'live') {
        return <LiveFlare />;
    } else if (flare === 'olas365') {
        return <OlasFlare size={size} />;
    }
    return null;
});

export const LiveFlare = memo(() => {
    return (
        <View style={{ width: '100%', height: '100%', backgroundColor: 'red', overflow: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    );
});

export const OlasFlare = memo(({ size }: { size: number }) => {
    return (
        <Canvas style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Rect x={0} y={0} width={size} height={size}>
            <SweepGradient
                c={vec(size / 2, size / 2)}
                colors={["#112FED", "cyan", "#112FED"]}
            />
            </Rect>
        </Canvas>
    );
}, (prevProps, nextProps) => {
    return prevProps.size === nextProps.size;
});