import { Pressable } from "react-native";
import { Bell } from "lucide-react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import { router } from "expo-router";

export default function NotificationsButton() {
    const { colors } = useColorScheme();
    return <Pressable onPress={() => router.push('/notifications')}>
        <Bell size={24} color={colors.foreground} />
    </Pressable>
}