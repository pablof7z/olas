import { useNDK, useSubscribe } from '@/ndk-expo';
import { Icon, MaterialIconName } from '@roninoss/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';

import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import {
  ESTIMATED_ITEM_HEIGHT,
  List,
  ListDataItem,
  ListItem,
  ListRenderItemInfo,
  ListSectionHeader,
} from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { walleteStore } from '@/app/stores';
import { useStore } from 'zustand';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { CashuMint, GetInfoResponse } from '@cashu/cashu-ts';

export default function RelaysScreen() {
    const { ndk } = useNDK();
    const { activeWallet } = useStore(walleteStore)
    const [ searchText, setSearchText ] = useState<string | null>(null);
    const [url, setUrl] = useState<string>("");
    const [mints, setMints] = useState<string[]>(activeWallet?.mints??[]);

    const filter = useMemo(() => ([{ kinds: [38172], limit: 50 }]), [1]);
    const opts = useMemo(() => ({ groupable: false, closeOnEose: true, subId: 'mints' }), []);
    const { events: mintList } = useSubscribe({ filters: filter, opts });
    const [mintInfos, setMintInfos] = useState<Record<string, GetInfoResponse | null>>({});

    const addFn = () => {
        try {
            const uri = new URL(url)
            if (!['https:', 'http:'].includes(uri.protocol)) {
                alert("Invalid protocol")
                return;
            }
            setMints([...mints, url])
            setUrl("");
        } catch (e) {
            alert("Invalid URL")
        }
    };

    const data = useMemo(() => {
        if (!ndk || !activeWallet) return []
        const regexp = new RegExp(/${searchText}/i)

        const m = mints.map(mint => ({
            id: mint,
            title: mint,
            removeFn: () => removeMint(mint),
        }))
        .filter(item => (searchText??'').trim().length === 0 || item.title.match(regexp!))

        m.push({ id: 'add', addFn: addFn, set: setUrl })

        for (const event of mintList) {
            const url = event.tagValue("u");
            if (!url || mints.includes(url)) continue;
            const niceUrl = new URL(url).hostname;

            // if (mintInfos[url] === undefined) {
            //     setMintInfos({...mintInfos, [url]: null});
            //     CashuMint.getInfo(url).then(info => setMintInfos({...mintInfos, [url]: info}));
            // }

            m.push({
                id: url,
                title: mintInfos[url]?.name ?? niceUrl,
                subTitle: url,
                addFn: () => addMint(url),
            })
        }
        
        return m;
  }, [mintList, mints, searchText, mintInfos]);

    const save = () => {
        if (!activeWallet) return;

        activeWallet.mints = mints;
        activeWallet.publish().then(() => {
            router.back()
        })
    }

    const unselectedMints = useMemo(() => mintList.filter(m => {
        const url = m.tagValue("u");
        if (!url || mints.includes(url)) return false;
        return true;
    }).map(m => m.tagValue("u")), [ mintList])

    const addMint = (url: string) => {
        setMints([...mints, url])
    }

    const removeMint = (url: string) => {
        setMints(mints.filter(u => u !== url));
    }
  

  return (
    <>
        <LargeTitleHeader
          title="Mints"
          searchBar={{ iosHideWhenScrolling: true, onChangeText: setSearchText }}
          rightView={() => (
            <TouchableOpacity onPress={save}>
                <Text className="text-primary">Save</Text>
            </TouchableOpacity>
          )}
        />
            <Text>here {data.length}</Text>
        <View className="flex-1">
            <List
                contentContainerClassName="pt-4"
                contentInsetAdjustmentBehavior="automatic"
                variant="insets"
                data={data}
                estimatedItemSize={ESTIMATED_ITEM_HEIGHT.titleOnly}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                sectionHeaderAsGap
            />
        </View>
    </>
  );
}

function renderItem<T extends (typeof data)[number]>(info: ListRenderItemInfo<T>) {
    if (info.item.id === 'add') {
        return (
            <ListItem
                className={cn(
                'ios:pl-0 pl-2',
                info.index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                )}
                titleClassName="text-lg"
                leftView={info.item.leftView}
                rightView={(
                    <TouchableOpacity onPress={info.item.addFn}>
                        <Text className="text-primary pr-4 mt-2">Add</Text>
                    </TouchableOpacity>
                )}
                {...info}
            >
                <TextInput
                    className="flex-1 text-lg"
                    placeholder="Add mint"
                    onChangeText={info.item.set}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </ListItem>
        )
    } else if (info.item.kind === 38172) {
    }
        return (
            <ListItem
                className={cn(
                    'ios:pl-0 pl-2',
                    info.index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                )}
                titleClassName="text-lg"
                leftView={info.item.leftView}
                rightView={(
                    (info.item.addFn ? (
                        <TouchableOpacity onPress={info.item.addFn}>
                            <Text className="text-primary pr-4 mt-2">
                                Add
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={info.item.removeFn}>
                            <Text className="text-primary pr-4 mt-2">
                                Remove
                            </Text>
                        </TouchableOpacity>
                    ))
                )}
                {...info}
            />
    );
}

function ChevronRight() {
  const { colors } = useColorScheme();
  return <Icon name="chevron-right" size={17} color={colors.grey} />;
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
  return typeof item === 'string' ? item : item.id;
}