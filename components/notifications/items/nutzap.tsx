import { NDKNutzap } from '@nostr-dev-kit/ndk-mobile';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/nativewindui/Text';
import { formatMoney } from '@/utils/bitcoin';

export function ItemNutzap({ event }: { event: NDKNutzap }) {
    const wrapped = useMemo(() => NDKNutzap.from(event), [event.id]);

    return (
        <View className="flex-row items-center justify-between gap-2">
            <Text>{wrapped.content}</Text>
            <Text variant="title1">
                {formatMoney({ amount: wrapped.amount, unit: wrapped.unit })}
            </Text>
        </View>
    );
}
