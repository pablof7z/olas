import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { captionBottomSheetRefAtom } from './CaptionBottomSheet';

import { Text } from '@/components/nativewindui/Text';
import { useEditorStore } from '@/lib/publish/store/editor';

export default function Caption() {
    const caption = useEditorStore((state) => state.caption);
    const [captionBottomSheetRef] = useAtom(captionBottomSheetRefAtom);

    const openCaptionSheet = useCallback(() => {
        captionBottomSheetRef?.current?.present();
    }, [captionBottomSheetRef]);

    return (
        <TouchableOpacity style={styles.captionContainer} onPress={openCaptionSheet}>
            <Text style={styles.captionText}>{caption || 'Add a caption...'}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    captionContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    captionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    captionText: {
        fontSize: 16,
        color: '#666',
        minHeight: 50,
    },
});
