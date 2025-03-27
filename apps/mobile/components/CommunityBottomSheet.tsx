import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { atom, useAtom, useSetAtom } from 'jotai';
import { type RefObject, useCallback, useEffect, useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { List, ListItem } from '@/components/nativewindui/List';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import { cn } from '@/lib/cn';
import { useMyGroups } from '@/lib/groups/store';
import type { GroupEntry } from '@/lib/groups/types';
import { COMMUNITIES_ENABLED } from '@/utils/const';

type CommunityBottomSheetRefAtomType = RefObject<BottomSheetModal> | null;
export const communityBottomSheetRefAtom = atom<
    CommunityBottomSheetRefAtomType,
    [CommunityBottomSheetRefAtomType],
    null
>(null, (_get, set, value) => set(communityBottomSheetRefAtom, value));

export function CommunityBottomSheet() {
    if (!COMMUNITIES_ENABLED) return null;

    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(communityBottomSheetRefAtom);
    const inset = useSafeAreaInsets();

    const myGroups = useMyGroups();

    useEffect(() => {
        setBottomSheetRef(ref);

        return () => {
            setBottomSheetRef(null);
        };
    }, [ref, setBottomSheetRef]);

    const setGroup = useCallback(
        (_group: GroupEntry) => {
            ref.current?.dismiss();
        },
        [ref]
    );

    return (
        <Sheet
            ref={ref}
            snapPoints={['50%']}
            maxDynamicContentSize={Dimensions.get('window').height * 0.7}
        >
            <BottomSheetView
                style={{
                    flexDirection: 'column',
                    width: '100%',
                    paddingHorizontal: 20,
                    paddingBottom: inset.bottom,
                    minHeight: 370,
                }}
            >
                <Text variant="title1" className="text-grow text-foreground">
                    Community Sharing
                </Text>

                <List
                    data={Array.from(myGroups.values())}
                    keyExtractor={(item) => item.groupId}
                    estimatedItemSize={52}
                    variant="insets"
                    renderItem={({ item, index, target }) => (
                        <ListItem
                            item={{
                                title: item.name,
                            }}
                            leftView={
                                <Image
                                    source={{ uri: item.picture }}
                                    style={{ width: 24, height: 24, borderRadius: 4 }}
                                />
                            }
                            onPress={() => setGroup(item)}
                            className={cn(
                                'ios:pl-0 pr-2',
                                index === 0 &&
                                    'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                            )}
                            titleClassName="text-lg"
                            index={index}
                            target={target}
                        />
                    )}
                />
            </BottomSheetView>
        </Sheet>
    );
}
