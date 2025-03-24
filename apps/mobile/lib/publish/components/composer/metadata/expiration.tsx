import { RefObject, useEffect, useRef } from "react";
import { useEditorStore, expirationBottomSheetRefAtom } from "@/lib/publish/store/editor";
import { useColorScheme } from "@/lib/useColorScheme";
import { Timer } from "lucide-react-native";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAtom } from "jotai";
import ExpirationBottomSheet, { 
    EXPIRATION_OPTIONS, 
    ExpirationBottomSheetRef 
} from "./ExpirationBottomSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";

export default function Expiration() {
    const { colors } = useColorScheme();
    const expiration = useEditorStore(state => state.expiration);
    const setExpiration = useEditorStore(state => state.setExpiration);
    
    const bottomSheetRef = useRef<ExpirationBottomSheetRef>(null);
    const [expirationBottomSheetRef, setExpirationBottomSheetRef] = useAtom(expirationBottomSheetRefAtom);

    useEffect(() => {
        setExpirationBottomSheetRef(bottomSheetRef);
        return () => {
            setExpirationBottomSheetRef(null);
        };
    }, [setExpirationBottomSheetRef]);

    const getExpirationLabel = () => {
        if (expiration === null) return "No expiration";
        const option = EXPIRATION_OPTIONS.find(opt => opt.value === expiration);
        return option ? option.label : "Custom";
    };

    const handleOpenBottomSheet = () => {
        bottomSheetRef.current?.present();
    };

    return (
        <>
            <TouchableOpacity 
                style={styles.container} 
                onPress={handleOpenBottomSheet}
            >
                <View style={styles.leftContainer}>
                    <Timer size={20} color={colors.foreground} />
                    <Text style={[styles.label, { color: colors.foreground }]}>Expiration</Text>
                </View>
                <Text style={[styles.value, { color: colors.foreground }]}>
                    {getExpirationLabel()}
                </Text>
            </TouchableOpacity>

            <ExpirationBottomSheet
                ref={bottomSheetRef}
                initialValue={expiration}
                onValueChange={setExpiration}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
    }
});