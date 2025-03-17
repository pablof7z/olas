import { Link, Stack, usePathname } from 'expo-router';
import { View } from 'react-native';

import { Text } from '~/components/nativewindui/Text';

export default function NotFoundScreen() {
    const screenName = usePathname();

    return (
        <>
            <Stack.Screen options={{ title: 'Oops!' }} />
            <View className="flex-1 items-center justify-center bg-background p-5">
                <Text variant="largeTitle">This screen doesn't exist.</Text>

                <Text>{screenName}</Text>

                <Link href="/" className="m-4 py-4">
                    <Text>Go to home screen!</Text>
                </Link>
            </View>
        </>
    );
}
