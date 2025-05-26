import { Text } from '@/components/nativewindui/Text';
import { Pressable, StyleSheet } from 'react-native';

interface NextButtonProps {
    buttonText: string;
    disabled?: boolean;
    onPress: () => void;
}

export function NextButton({ onPress, disabled, buttonText } : NextButtonProps) {
    return(
        <Pressable
            style={[styles.actionButton, { backgroundColor: 'white' }]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text
                style={[
                    styles.actionButtonText,
                    { color: 'black', paddingHorizontal: 8 },
                ]}
            >
                {buttonText}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    actionButtonIcon: {
        marginRight: 10,
    },
});