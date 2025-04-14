import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
    container: {
        padding: 16,
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        letterSpacing: 0.3,
        color: 'white',
    },
    input: {
        height: 52,
        borderRadius: 12,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: 'rgba(35, 36, 48, 0.5)',
        color: 'white',
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    suggestionsContainer: {
        marginTop: 12,
        height: 240,
        minHeight: 120,
        width: '100%',
        borderRadius: 16,
        borderWidth: 1.5,
        overflow: 'hidden',
        backgroundColor: 'rgba(35, 36, 48, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    mentionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    mentionItemLast: {
        borderBottomWidth: 0,
    },
    mentionItemPressed: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    mentionAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    mentionTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    mentionName: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 2,
    },
    mentionHandle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    button: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#0ea5e9',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
