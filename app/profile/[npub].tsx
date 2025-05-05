import { toast } from '@backpackapp-io/react-native-toast';
import { NDKUser } from '@nostr-dev-kit/ndk-mobile';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function ProfileRedirect() {
    const { npub } = useLocalSearchParams<{ npub: string }>();

    useEffect(() => {
        if (!npub) {
            // If no npub is provided, redirect to home
            router.replace('/');
            return;
        }

        try {
            // Handle the case where npub might include a path prefix
            // e.g., olas://profile/npub... or just npub...
            const cleanNpub = npub.startsWith('npub') ? npub : npub.substring(npub.indexOf('npub'));

            // Convert npub to pubkey
            const user = new NDKUser({ npub: cleanNpub });
            const pubkey = user.pubkey;

            if (!pubkey) {
                throw new Error('Failed to extract pubkey from npub');
            }

            // Redirect to the profile page with the pubkey
            router.replace({
                pathname: '/profile',
                params: { pubkey },
            });
        } catch (error) {
            console.error('Error converting npub to pubkey:', error);
            toast.error('Invalid npub format');
            // Redirect to home on error
            router.replace('/');
        }
    }, [npub]);

    // Show loading indicator while redirecting
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
        </View>
    );
}
