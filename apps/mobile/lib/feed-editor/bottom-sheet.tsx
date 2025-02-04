import { View, StyleSheet, Pressable } from "react-native";
import { useAtomValue, useSetAtom } from "jotai";
import { feedEditorBottomSheetRefAtom, useFeedEditorStore } from "./store";
import { Sheet, useSheetRef } from "@/components/nativewindui/Sheet";
import { useEffect, useState  } from "react";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/nativewindui/Text";
import New from "./new";
import Confirm from "./confirm";

export default function FeedEditorBottomSheet() {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(feedEditorBottomSheetRefAtom);
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');

    useEffect(() => {
        setBottomSheetRef(ref);
    }, [ref, setBottomSheetRef]);

    const mode = useFeedEditorStore(s => s.mode);
    
    return (
        <Sheet ref={ref} snapPoints={['50%']} maxDynamicContentSize={Dimensions.get('window').height * 0.7}>
            <BottomSheetView
                style={{ flexDirection: 'column', width: '100%', paddingHorizontal: 20, paddingBottom: insets.bottom, minHeight: 370 }}
            >
                {mode === 'confirm' ? (
                    <Confirm />
                ) : (
                    <>
                    <View style={styles.optionsContainer}>
                        <Pressable style={styles.option} onPress={() => setActiveTab('new')}>
                            <Text variant={activeTab === 'new' ? 'title1' : 'body'}>New</Text>
                        </Pressable>
                        <Pressable style={styles.option} onPress={() => setActiveTab('existing')}>
                            <Text variant={activeTab === 'existing' ? 'title1' : 'body'}>Existing</Text>
                        </Pressable>
                    </View>

                        {activeTab === 'new' && <New />}
                    </>
                )}
            </BottomSheetView>
        </Sheet>
    )
}

const styles = StyleSheet.create({
    optionsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    option: {
    },
    activeTab: {
        backgroundColor: 'blue'
    },
    inactiveTab: {
        backgroundColor: 'red'
    }
});
