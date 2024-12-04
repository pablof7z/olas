import { CashuMint, GetInfoResponse, MintKeyset } from "@cashu/cashu-ts";
import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
import { useEffect, useState } from "react";
import { Checkbox } from '~/components/nativewindui/Checkbox';
import { StyleSheet, TouchableWithoutFeedback, View, Text } from "react-native";
import { ListItem } from "@/components/nativewindui/List";
import { TouchableOpacity } from "react-native-gesture-handler";
import { cn } from "@/lib/cn";

const MintListItem = ({ item, selected, onSelect }: { item: NDKEvent, selected: boolean, onSelect: (selected: boolean) => void }) => {
    const [mintInfo, setMintInfo] = useState<GetInfoResponse | null>(null);
    const [isChecked, setChecked] = useState(selected);
    const [units, setUnits] = useState<string[]>([]);

    const url = item.tagValue("u");
    if (!url) return null;

    useEffect(() => {
        CashuMint.getInfo(url).then(setMintInfo);
        const mint = new CashuMint(url);
        mint.getKeySets().then((keySets) => {
            const units = new Set<string>();
            keySets.keysets.forEach((keySet) => units.add(keySet.unit));
            setUnits(Array.from(units));
        });
    }, [url]);

    function toggleMint() {
        setChecked(!isChecked);
        onSelect(isChecked);
    }

    return (
        <ListItem
            className={cn(
                'ios:pl-0 pl-2'
            )}
            titleClassName="text-lg"
            rightView={(
                <TouchableOpacity onPress={item.fn}>
                    <Text className="text-primary pr-4 mt-2">Add</Text>
                </TouchableOpacity>
            )}
            item={{
                title: mintInfo?.name??url,
                subTitle: mintInfo?.description ?? ""
            }}
        >
        </ListItem>
    );
    (
        <View style={styles.container}>
            <Checkbox
                checked={isChecked}
                onCheckedChange={setChecked}
            />
            <TouchableWithoutFeedback onPress={toggleMint}>
                <View style={styles.textContainer}>
                    <Text style={styles.name} >{mintInfo?.name ?? url}</Text>
                    {( mintInfo && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.description} numberOfLines={1}>{mintInfo?.description}</Text>
                            
                            <Text style={styles.units}>{units.join(", ")}</Text>
                        </View>
                    ))}
                </View>
            </TouchableWithoutFeedback>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
    },
    checkbox: {
        height: 25,
        width: 25
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
    }
});

export default MintListItem;