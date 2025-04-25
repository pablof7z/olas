import { CashuMint, type GetInfoResponse, MintKeyset } from '@cashu/cashu-ts';
import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { ListItem } from '@/components/nativewindui/List';
import { cn } from '@/lib/cn';
import { Checkbox } from '~/components/nativewindui/Checkbox';

const MintListItem = ({
    item,
    selected,
    onSelect,
}: { item: NDKEvent; selected: boolean; onSelect: (selected: boolean) => void }) => {
    const [mintInfo, setMintInfo] = useState<GetInfoResponse | null>(null);
    const [isChecked, setChecked] = useState(selected);
    const [units, setUnits] = useState<string[]>([]);

    const url = item.tagValue('u');
    
    useEffect(() => {
        if (url) {
            CashuMint.getInfo(url).then(setMintInfo);
            const mint = new CashuMint(url);
            mint.getKeySets().then((keySets) => {
                const units = new Set<string>();
                keySets.keysets.forEach((keySet) => units.add(keySet.unit));
                setUnits(Array.from(units));
            });
        }
    }, [url]);

    if (!url) return null;

    function toggleMint() {
        setChecked(!isChecked);
        onSelect(isChecked);
    }

    return (
        <View style={styles.container}>
            <Checkbox checked={isChecked} onCheckedChange={setChecked} />
            <TouchableWithoutFeedback onPress={toggleMint}>
                <View style={styles.content}>
                    <Text style={styles.name}>{mintInfo?.name ?? url}</Text>
                    <Text style={styles.url}>{url}</Text>
                    <Text style={styles.balance}>{units.join(', ')}</Text>
                </View>
            </TouchableWithoutFeedback>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
    },
    checkbox: {
        height: 25,
        width: 25,
    },
    textContainer: {
        flex: 1,
    },
    descriptionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
    },
    units: {
        fontSize: 14,
    },
    content: {
        flex: 1,
    },
    url: {
        fontSize: 14,
    },
    balance: {
        fontSize: 14,
    },
});

export default MintListItem;
