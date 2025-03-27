import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { ShoppingCart, Tag } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '../nativewindui/Text';

import { formatMoney } from '@/utils/bitcoin';
import { useProductView } from '~/lib/product-view/hook';

export default function ProductGridContainer({
    event,
    children,
}: { event: NDKEvent; children: React.ReactNode }) {
    const price = event.getMatchingTags('price')[0];
    const openProductView = useProductView();

    if (!price) return null;

    return (
        <Pressable style={{ position: 'relative' }} onPress={() => openProductView(event)}>
            {children}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'flex-end',
                    alignItems: 'flex-start',
                }}
            >
                <View
                    style={{
                        margin: 4,
                        backgroundColor: 'white',
                        padding: 4,
                        paddingHorizontal: 8,
                        borderRadius: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <ShoppingCart size={16} fill="white" color="black" />
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'black' }}>
                        {formatMoney({ amount: Number(price[1]), unit: price[2] })}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}
