import { LargeTitleHeader } from "@/components/nativewindui/LargeTitleHeader/LargeTitleHeader.ios";
import { List, ListItem, ListRenderItemProps, ListSectionHeader } from "@/components/nativewindui/List";
import { Text } from "@/components/nativewindui/Text";
import { useAppSettingsStore } from "@/stores/app";
import { router } from "expo-router";
import { useAtom, useAtomValue } from "jotai";
import { atom } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

export type ZapOption = {
    amount: number;
    message: string;
}

const defaultZapAtom = atom<ZapOption, [ZapOption], null>(null, (get, set, zap) => set(defaultZapAtom, zap));
function DefaultZapRow({ index, target }) {
    const [defaultZap, setDefaultZap] = useAtom(defaultZapAtom);
    const inputRef = useRef<TextInput>(null);

    const appDefaultZap = useAppSettingsStore(s => s.defaultZap);
    useEffect(() => {
        if (!defaultZap) {
            setDefaultZap(appDefaultZap);
        }
    }, [appDefaultZap, defaultZap, setDefaultZap]);

    return (
        <View
            className="flex-row justify-between flex-1 gap-2"
        >
            <TextInput
                className="flex-1 py-4 px-4 text-foreground bg-card rounded-lg"
                value={defaultZap?.message}
                onChangeText={(text) => setDefaultZap({ ...defaultZap, message: text })}
                returnKeyLabel="Next"
                returnKeyType="next"
                onSubmitEditing={() => inputRef.current?.focus()}
            />
            <TextInput
                ref={inputRef}
                className="py-2 px-4 text-foreground bg-card rounded-lg w-[100px]"
                value={defaultZap?.amount?.toString()}
                textAlign="right"
                keyboardType="numeric"
                onChangeText={(text) => setDefaultZap({ ...defaultZap, amount: Number(text) })}
            />
        </View>
    )
}

export default function Zaps() {
    const settings = useMemo(() => {
        const opts = [
            'Default zap',
            'default-zap',
        ];

        return opts;
    }, [1])

    const setDefaultZap = useAppSettingsStore(s => s.setDefaultZap);

    const defaultZap = useAtomValue(defaultZapAtom);
    const save = useCallback(() => {
        setDefaultZap(defaultZap);
        router.back();
    }, [defaultZap, setDefaultZap]);
    
    return (
        <>
            <LargeTitleHeader
                title="Zaps"
                rightView={() => (
                    <TouchableOpacity onPress={save}>
                        <Text className="text-primary">Save</Text>
                    </TouchableOpacity>
                )}
            />

            <List
                data={settings}
                renderItem={({ item, index, target }) => Item({ item, index, target })}
                variant="insets"
                sectionHeaderAsGap={false}
            />
        </>
    );
}

function Item({ item, index, target }) {
    if (item === 'default-zap') {
        return <DefaultZapRow index={index} target={target} />;
    } else if (typeof item === 'string') {
        return <ListSectionHeader {...{ item, index, target }} />;
    }
    
    return (
        <ListItem
            index={index}
            target={target}
            item={item}
        />
    );
}