import { Pressable, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { router } from 'expo-router';
import { useNotifications } from '@/hooks/notifications';

export default function NotificationsButton() {
    const { colors } = useColorScheme();
    const notifications = useNotifications(true);

    return (
        <Pressable
            className="relative flex-row items-center"
            onPress={() => router.push('/notifications')}>
            <Bell size={24} color={colors.foreground} />
            {notifications.length > 0 && <Indicator />}
        </Pressable>
    );
}

function Indicator() {
    return <View className="bg-red-500 rounded-full w-2 h-2" />;
}