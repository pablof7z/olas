import { atom, useAtom, useSetAtom } from 'jotai';
import * as SettingsStore from 'expo-secure-store';
import { Sheet, useSheetRef } from '../nativewindui/Sheet';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedTypeList from '.';
import { FeedType, feedTypeAtom } from './store';
import { Dimensions } from 'react-native';

export const sheetAtom = atom<BottomSheetModal, [BottomSheetModal], void>(null, (get, set, value) => {
    set(sheetAtom, value);
});

export default function FeedTypeBottomSheet() {
    const sheetRef = useSheetRef();
    const setSheet = useSetAtom(sheetAtom);
    const inset = useSafeAreaInsets();
    const [value, setValue] = useAtom(feedTypeAtom);

    useEffect(() => {
        setSheet(sheetRef.current);
    }, [sheetRef.current]);

    const onSelect = useCallback(
        (value?: FeedType) => {
            if (value) {
                setValue(value);
                SettingsStore.setItemAsync('feed', JSON.stringify(value));
            }
            sheetRef.current?.dismiss();
        },
        [setValue, sheetRef.current]
    );

    const snapPoints = useMemo(() => ['80%'], []);

    const maxHeight = Dimensions.get('window').height - inset.top - inset.bottom;

    return (
        <Sheet snapPoints={snapPoints} ref={sheetRef} maxDynamicContentSize={maxHeight}>
            <BottomSheetView style={{ padding: 10, paddingBottom: inset.bottom, flex: 1 }}>
                <FeedTypeList value={value} onSelect={onSelect} />
            </BottomSheetView>
        </Sheet>
    );
}
