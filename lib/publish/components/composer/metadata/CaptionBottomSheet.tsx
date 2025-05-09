import { type BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { type RefObject, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import { useEditorStore } from '@/lib/publish/store/editor';
import { useColorScheme } from '@/lib/useColorScheme';

export const captionBottomSheetRefAtom = atom<RefObject<BottomSheetModal> | null>(null);
const captionAtom = atom('');

function Content() {
    const [localCaption, setLocalCaption] = useAtom(captionAtom);
    const { isDarkColorScheme, colors } = useColorScheme();

    return (
        <BottomSheetTextInput
            placeholder="Write a caption..."
            placeholderTextColor={colors.muted}
            multiline
            style={[
                styles.captionInput,
                {
                    color: colors.foreground,
                    backgroundColor: 'transparent',
                },
            ]}
            value={localCaption}
            onChangeText={setLocalCaption}
            autoFocus
        />
    );
}

function Buttons() {
    const caption = useAtomValue(captionAtom);
    const setCaption = useEditorStore((state) => state.setCaption);
    const bottomSheetRef = useAtomValue(captionBottomSheetRefAtom);

    const handleSave = useCallback(() => {
        setCaption(caption);
        bottomSheetRef?.current?.dismiss();
    }, [caption, setCaption, bottomSheetRef]);

    return (
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button variant="plain" onPress={handleSave}>
                <Text>Save</Text>
            </Button>
        </View>
    );
}
export default function PostCaptionBottomSheet() {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(captionBottomSheetRefAtom);

    useEffect(() => {
        setBottomSheetRef(ref);
    }, [setBottomSheetRef]);

    return (
        <Sheet ref={ref} snapPoints={['50%']} enablePanDownToClose>
            <BottomSheetView style={styles.container}>
                <View style={{ flex: 1, flexDirection: 'column', width: '100%' }}>
                    <Buttons />
                    <View style={{ flex: 1 }}>
                        <Content />
                    </View>
                </View>
            </BottomSheetView>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    captionInput: {
        flex: 1,
        fontSize: 16,
        paddingTop: 16,
    },
});
