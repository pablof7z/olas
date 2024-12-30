import { View } from 'react-native';
import { Text } from './nativewindui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator } from './nativewindui/ActivityIndicator';
import { useRef, useState } from 'react';
import { Image } from 'react-native';

export default function LoaderScreen({
    children,
    appReady,
    wotReady,
}: {
    children: React.ReactNode;
    appReady: boolean;
    wotReady: boolean;
}) {
    const inset = useSafeAreaInsets();
    const haveInterval = useRef(false);
    const [ignoreWot, setIgnoreWot] = useState(true);

    if (appReady && !wotReady && !haveInterval.current) {
        haveInterval.current = true;
        setInterval(() => {
            setIgnoreWot(true);
        }, 3000);
    }

    if (appReady && (wotReady || ignoreWot)) {
        return children;
    }

    const logo = require('../assets/logo.png');

    return (
        <View className="h-screen w-screen flex-1 items-center justify-center bg-card">
            <Image source={logo} style={{ width: 300, height: 100, objectFit: 'contain' }} />

            <Text variant="largeTitle" className="mt-4 text-5xl font-black">
                Olas
            </Text>
            <Text variant="callout" className="font-medium opacity-40">
                Make waves
            </Text>

            <View className="absolute bottom-0 left-0 right-0 flex-col items-center gap-2 p-4" style={{ paddingBottom: inset.bottom }}>
                <ActivityIndicator size="small" color="#FF7F00" />

                <Text variant="caption1" className="font-light">
                    <LoadingText appReady={appReady} wotReady={wotReady} />
                </Text>
            </View>
        </View>
    );
}

function LoadingText({ appReady, wotReady }: { appReady: boolean; wotReady: boolean }) {
    if (!appReady) {
        return 'Loading Olas';
    }

    if (!wotReady) {
        return 'Loading web-of-trust...';
    }

    return 'Ready';
}
