import { useFeedEditorStore } from './store';
import { View, StyleSheet } from 'react-native';
import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { List, Share } from 'lucide-react-native';
import { useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { feedEditorBottomSheetRefAtom } from './store';

export default function Confirm() {
    const { title, setMode } = useFeedEditorStore();
    const feedRef = useAtomValue(feedEditorBottomSheetRefAtom);

    const close = useCallback(() => {
        feedRef?.current?.dismiss();
    }, [feedRef]);
    
    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <Text variant="title1">
                    Private feed saved
                </Text>
                <Text variant="body">
                    {title} is now accessible from your list of private feeds.
                </Text>
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    variant="primary"
                    onPress={() => setMode('edit')}
                    size="lg"
                >
                    <List size={24} color="white" />
                    <Text>Edit feed settings</Text>
                </Button>

                {/* close button */}
                <Button
                    variant="plain"
                    onPress={close}
                >
                    <Text>Close</Text>
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    innerContainer: {
        justifyContent: 'center',
    },
    buttonContainer: {
        flexDirection: 'column',
        gap: 10,
    },
});
