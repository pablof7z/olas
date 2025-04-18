import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 14,
        color: '#666666',
        marginTop: 2,
    },
    value: {
        fontSize: 14,
        opacity: 0.5
    },
});

export const infoSheetStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 24,
        textAlign: 'left',
    },
    subtitle: {
        fontSize: 14,
        color: '#666666',
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
    },
});

export const valueSheetStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    headerContainer: {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    titleContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'left',
    },
    description: {
        fontSize: 14,
        textAlign: 'left',
    },
    optionItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    optionDescription: {
        fontSize: 14,
        marginBottom: 16,
        fontWeight: '300',
        opacity: 0.8,
        textAlign: 'left',
    },
    flatListContent: {
        paddingBottom: 24,
    },
    helpLink: {
    },
    helpText: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
}); 


export const iconSize = 28;