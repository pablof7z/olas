import { LargeTitleHeader } from '@/components/nativewindui/LargeTitleHeader/LargeTitleHeader.ios';
import { List, ListItem, ListRenderItemProps, ListSectionHeader } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import ZapButton from '@/components/events/Post/Reactions/Zaps';
import { useAppSettingsStore } from '@/stores/app';
import { router } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import { atom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { Slider } from '@/components/nativewindui/Slider';

export type ZapOption = {
    amount: number;
    message: string;
};

const defaultZapAtom = atom<ZapOption, [ZapOption], null>(null, (get, set, zap) => set(defaultZapAtom, zap));
const yoloZapsAtom = atom<boolean>();
const yoloZapsGrowthFactorAtom = atom<number>();

function DefaultZapRow({ index, target }) {
    const [defaultZap, setDefaultZap] = useAtom(defaultZapAtom);
    const inputRef = useRef<TextInput>(null);

    const appDefaultZap = useAppSettingsStore((s) => s.defaultZap);
    useEffect(() => {
        if (!defaultZap) {
            setDefaultZap(appDefaultZap);
        }
    }, [appDefaultZap, defaultZap, setDefaultZap]);

    return (
        <View className="flex-1 flex-row justify-between gap-2">
            <TextInput
                className="flex-1 rounded-lg bg-card px-4 py-4 text-foreground"
                value={defaultZap?.message}
                onChangeText={(text) => setDefaultZap({ ...defaultZap, message: text })}
                returnKeyLabel="Next"
                returnKeyType="next"
                onSubmitEditing={() => inputRef.current?.focus()}
            />
            <TextInput
                ref={inputRef}
                className="w-[100px] rounded-lg bg-card px-4 py-2 text-foreground"
                value={defaultZap?.amount?.toString()}
                textAlign="right"
                keyboardType="numeric"
                onChangeText={(text) => setDefaultZap({ ...defaultZap, amount: Number(text) })}
            />
        </View>
    );
}

function YoloZapsRow({ index, target }) {
    const [yoloZaps, setYoloZaps] = useAtom(yoloZapsAtom);
    const [yoloZapsGrowthFactor, setYoloZapsGrowthFactor] = useAtom(yoloZapsGrowthFactorAtom);

    const [aggressiveness, setAggressiveness] = useState(yoloZapsGrowthFactor);

    const saveTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);

        saveTimer.current = setTimeout(() => {
            console.log('saving yolo zaps growth factor', aggressiveness);
            setYoloZapsGrowthFactor(aggressiveness);
            saveTimer.current = null;
        }, 100);
    }, [aggressiveness, setYoloZapsGrowthFactor]);

    return (
        <>
            <ListItem
                index={index}
                target={target}
                item={{
                    title: 'YOLO zaps',
                    subTitle: 'Zap by swiping the ⚡️ icon',
                }}
                rightView={
                    <View style={{ paddingRight: 10 }}>
                        <Switch value={yoloZaps} onValueChange={setYoloZaps} />
                    </View>
                }
            />
            {yoloZaps && (
                <ListItem
                    index={index}
                    target={target}
                    item={{
                        title: 'Growth factor',
                        subTitle: 'How fast yolo zaps increase',
                    }}
                    rightView={
                        <View style={{ width: 24, height: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <ZapButton iconSize={24} inactiveColor="gray" growthFactor={aggressiveness} />
                        </View>
                    }>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Slider
                            minimumValue={0.0000001}
                            maximumValue={1.5}
                            value={aggressiveness}
                            onValueChange={setAggressiveness}
                            style={{ flex: 1 }}
                        />
                    </View>
                </ListItem>
            )}
            <Text variant="caption1" className="p-2 text-muted-foreground">
                After sending a YOLO zap, you can tap it for a few seconds to cancel it.
            </Text>
        </>
    );
}

export default function Zaps() {
    const settings = useMemo(() => {
        const opts = [];

        opts.push('One-tap zap');
        opts.push('default-zap');

        opts.push('YOLO zaps');
        opts.push('yolo-zaps');

        return opts;
    }, [1]);

    const setDefaultZap = useAppSettingsStore((s) => s.setDefaultZap);
    const yoloZaps = useAppSettingsStore((s) => s.yoloZaps);
    const yoloZapsGrowthFactor = useAppSettingsStore((s) => s.yoloZapsGrowthFactor);

    const defaultZap = useAppSettingsStore((s) => s.defaultZap);
    const setYoloZaps = useAppSettingsStore((s) => s.setYoloZaps);
    const setYoloZapsGrowthFactor = useAppSettingsStore((s) => s.setYoloZapsGrowthFactor);

    const [defaultZapLocal, setDefaultZapLocal] = useAtom(defaultZapAtom);
    const [yoloZapLocal, setYoloZapLocal] = useAtom(yoloZapsAtom);
    const [yoloZapGrowthFactorLocal, setYoloZapGrowthFactorLocal] = useAtom(yoloZapsGrowthFactorAtom);

    const save = useCallback(() => {
        setDefaultZap(defaultZapLocal);
        setYoloZaps(yoloZapLocal === true);
        setYoloZapsGrowthFactor(yoloZapGrowthFactorLocal ?? 0.85);
        router.back();
    }, [defaultZapLocal, setDefaultZap, yoloZapLocal, yoloZapGrowthFactorLocal]);

    useEffect(() => {
        setDefaultZapLocal(defaultZap);
        setYoloZapLocal(yoloZaps);
        setYoloZapGrowthFactorLocal(yoloZapsGrowthFactor);
    }, [defaultZap, setDefaultZap, yoloZaps, yoloZapsGrowthFactor]);

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
    } else if (item === 'yolo-zaps') {
        return <YoloZapsRow index={index} target={target} />;
    } else if (typeof item === 'string') {
        return <ListSectionHeader {...{ item, index, target }} />;
    }

    return <ListItem index={index} target={target} item={item} />;
}
