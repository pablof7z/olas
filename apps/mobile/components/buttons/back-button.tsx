import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { TouchableOpacity, StyleSheet } from "react-native";

export default function BackButton() {
    return (
        <TouchableOpacity onPress={() => router.back()} style={style.container}>
            <ArrowLeft size={24} color={"white"} />
        </TouchableOpacity>
    )
}

const style = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        backgroundColor: '#00000099',
        borderRadius: 100,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    }
})