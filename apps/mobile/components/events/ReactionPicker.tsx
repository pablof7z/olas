import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Sheet, useSheetRef } from "@/components/nativewindui/Sheet";
import { Text } from "@/components/nativewindui/Text";

type ReactionPickerProps = {
    onSelect: (emoji: string) => void;
    onClose: () => void;
};

const reactionList = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export default function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
    const sheetRef = useSheetRef();

    return (
        <Sheet ref={sheetRef} onDismiss={onClose}>
            <View style={styles.container}>
                <Text variant="title1" style={styles.title}>React with</Text>
                <View style={styles.emojisContainer}>
                    {reactionList.map((emoji) => (
                        <TouchableOpacity
                            key={emoji}
                            style={styles.emojiButton}
                            onPress={() => {
                                sheetRef.current?.dismiss();
                                onSelect(emoji);
                            }}
                        >
                            <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: "center",
    },
    title: {
        marginBottom: 20,
    },
    emojisContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
    },
    emojiButton: {
        padding: 10,
    },
    emojiText: {
        fontSize: 30,
    },
});
