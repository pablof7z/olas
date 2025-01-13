import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Text } from '@/components/nativewindui/Text';
import { RefObject, useCallback, useEffect, useMemo } from 'react';
import { atom, useAtom, useSetAtom } from 'jotai';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { metadataAtom } from '@/components/NewPost/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, View } from 'react-native';
import { MapPin, MapPinMinus, Type } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { Button } from '@/components/nativewindui/Button';
import { useAppSettingsStore } from '@/stores/app';
import { GroupEntry, useGroups } from '@/app/communities';
import { List, ListItem } from '../nativewindui/List';
import { NDKKind, NDKList, NDKRelay, NDKTag, useNDK, useNDKSessionEventKind } from '@nostr-dev-kit/ndk-mobile';
import { cn } from '@/lib/cn';

type CommunityBottomSheetRefAtomType = RefObject<BottomSheetModal> | null;
export const communityBottomSheetRefAtom = atom<CommunityBottomSheetRefAtomType, [CommunityBottomSheetRefAtomType], null>(
    null,
    (get, set, value) => set(communityBottomSheetRefAtom, value)
);

export function CommunityBottomSheet() {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(communityBottomSheetRefAtom);
    const inset = useSafeAreaInsets();
    const [metadata, setMetadata] = useAtom(metadataAtom);

    useEffect(() => {
        setBottomSheetRef(ref);

        return () => {
            console.log('unmounting community bottom sheet');
            setBottomSheetRef(null);
        };
    }, [ref, setBottomSheetRef]);

    const { ndk } = useNDK();
    const groupList = useNDKSessionEventKind<NDKList>(NDKList, NDKKind.SimpleGroupList, { create: true });

    const setGroup = useCallback(
        (groupTag: NDKTag) => {
            setMetadata({ ...metadata, group: {
                groupId: groupTag[1],
                relays: groupTag.slice(2)
            } });
            ref.current?.dismiss();
        },
        [metadata, setMetadata, ref, ndk]
    );

    return (
        <Sheet ref={ref} snapPoints={['50%']} maxDynamicContentSize={Dimensions.get('window').height * 0.7}>
            <BottomSheetView
                style={{ flexDirection: 'column', width: '100%', paddingHorizontal: 20, paddingBottom: inset.bottom, minHeight: 370 }}>
                <Text variant="title1" className="text-grow text-foreground">
                    Community Sharing
                </Text>

                <List
                    data={groupList.items}
                    keyExtractor={(item) => item[1]}
                    estimatedItemSize={52}
                    variant="insets"
                    renderItem={({ item, index, target }) => (
                        <ListItem
                            item={{
                                title: item[1],
                            }}
                            onPress={() => setGroup(item)}
                            className={cn('ios:pl-0 pr-2', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
                            titleClassName="text-lg"
                            index={index}
                            target={target}
                        >
                        </ListItem>
                    )}
                />
            </BottomSheetView>
        </Sheet>
    );
}
