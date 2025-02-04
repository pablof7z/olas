import { useColorScheme } from "@/lib/useColorScheme";
import { View } from "react-native";
import CalendarButton from "./CalendarButton";
import Feed from "./Feed";
import NotificationsButton from "./NotificationsButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeHeader() {
    const { colors } = useColorScheme();
    const insets = useSafeAreaInsets();

    return (
        <View className="!bg-card border-b border-border pb-1" style={{ flexDirection: 'row', alignItems: 'center', paddingTop: insets.top, width: '100%' }}>
            <Feed />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: '10' }}>
                <CalendarButton />
                <NotificationsButton />
            </View>
        </View>
    )
}
