import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Text } from '@/components/nativewindui/Text';
import { RefObject, useEffect, useMemo } from 'react';
import { atom, useAtom, useSetAtom } from 'jotai';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { metadataAtom } from '@/components/NewPost/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, View } from 'react-native';
import { Type } from 'lucide-react-native';
import { Image } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { Button } from '@/components/nativewindui/Button';
import { useAppSettingsStore } from '@/stores/app';

export type PostType = {
    id: string;
    type: 'photo' | 'video';
    uri: string;
}

type PostTypeSheetRefAtomType = RefObject<BottomSheetModal> | null;

export const postTypeSheetRefAtom = atom<PostTypeSheetRefAtomType, [PostTypeSheetRefAtomType], null>(
    null,
    (get, set, value) => set(postTypeSheetRefAtom, value)
);


export function PostTypeBottomSheet() {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(postTypeSheetRefAtom);
    const inset = useSafeAreaInsets();
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const setAppSettingsPostType = useAppSettingsStore(state => state.setPostType);

    useEffect(() => {
        setBottomSheetRef(ref);
    }, [ref, setBottomSheetRef]);

    const changeType = (type: 'high-quality' | 'generic') => {
        setMetadata({ ...metadata, type });
        setAppSettingsPostType(type);
        ref.current?.dismiss();
    };

    return (
        <Sheet
            ref={ref}
            snapPoints={['50%']}
            maxDynamicContentSize={Dimensions.get('window').height * 0.7}
        >
            <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: inset.bottom, minHeight: 500 }}>
                <Text variant="title1">Post Type</Text>

                <View className="w-full flex-1 flex-col gap-4 items-stretch">
                    <Text className="text-sm text-muted-foreground">
                        Nostr posts are accessible in a wide variety of; some apps prioritize displaying certain types of posts.
                    </Text>

                    <Button variant="secondary" className="flex-col items-start gap-2 p-4" onPress={() => changeType('high-quality')}>
                        <View className="flex-row items-center gap-2">
                            <Image size={48} />
                            <View className="flex-col gap-0">
                                <Text variant="caption1" className="text-lg font-bold">High Quality Post</Text>
                                <Text variant="caption2" className="text-sm text-muted-foreground">
                                    For your evergreen content.
                                </Text>
                            </View>
                        </View>
                        <Text className="text-sm text-muted-foreground">
                            Reach a smaller audience specifically looking for Olas-like content.
                        </Text>
                    </Button>

                    <Button variant="secondary" className="flex-col items-start gap-2 p-4" onPress={() => changeType('generic')}>
                        <View className="flex-row items-center gap-2">
                            <Type size={48} />
                            <View className="flex-col gap-0">
                                <Text variant="caption1" className="text-lg font-bold">Generic Post</Text>
                                <Text variant="caption2" className="text-sm text-muted-foreground">
                                    Use this for your everyday posts.
                                </Text>
                            </View>
                        </View>
                        <Text className="text-sm text-muted-foreground">
                            Reach a wider audience that are not specifically looking for this type of content (i.e. will show up in Damus, Primal and other clients)
                        </Text>
                    </Button>
                        
                    <View className="mb-8"></View>
                </View>
            </BottomSheetView>
        </Sheet>
    );
}