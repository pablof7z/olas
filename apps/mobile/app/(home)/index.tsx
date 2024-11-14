import { Text } from "@/components/nativewindui/Text";
import { useNDK, useSubscribe } from "@/ndk-expo";
import { useNDKWallet } from "@/ndk-expo/providers/wallet";
import { NDKEvent, NDKKind, NDKPrivateKeySigner, NDKRelaySet, NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk";
import { NDKCashuWallet, NDKWalletBalance, NDKWalletChange } from "@nostr-dev-kit/ndk-wallet";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, FlatList, Pressable, StyleSheet, TouchableHighlight, View } from "react-native";
import { useColorScheme } from '~/lib/useColorScheme';
import RelativeTime from "../components/relative-time";
import { router } from "expo-router";
import { walleteStore } from "../stores";
import { useStore } from "zustand";
import WelcomeConsentScreen from "../welcome";
import { Icon } from "@roninoss/icons";
import { FlashList } from "@shopify/flash-list";
import ImageCard from "@/components/events/ImageCard";

export default function HomeScreen() {
    const { ndk, currentUser } = useNDK();
    const { colors } = useColorScheme();
    const filters = useMemo(() => [
        {kinds: [1063], "#m": ["image/jpeg"], limit: 5}
    ], []);
    const opts = useMemo(() => ({
        cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY
    }), []);
    const { events } = useSubscribe({ filters, opts });

    if (!currentUser) {
        return <WelcomeConsentScreen />
    }

    return (
        <View className="flex-1 bg-card gap-2">
            <FlashList
                data={events}
                estimatedItemSize={240}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ImageCard event={item} />
                )}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 15,
    elevation: 4,
    alignItems: 'flex-start',
    marginVertical: 10,
    marginHorizontal: 16,
    height: 200,
    width: Dimensions.get('window').width * 0.75,
  },
  title: {
    fontSize: 16,
    color: '#ffffffa0', // Lighter translucent white for title
    marginBottom: 4,
    fontWeight: '500',
  },
  balance: {
    fontSize: 42, // Reduced font size slightly to fit within the card
    lineHeight: 52,
    fontWeight: '700',
    color: '#fff',
  },
  currency: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffffa0', // Matches the BTC color with lighter opacity
  },
  time: {
    fontSize: 14,
    color: '#ffffffc0', // Higher opacity than "transaction" for emphasis
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
});
