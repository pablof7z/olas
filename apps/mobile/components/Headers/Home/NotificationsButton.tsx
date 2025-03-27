import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useNotifications } from '@/hooks/notifications';
import { useColorScheme } from '@/lib/useColorScheme';

export default function NotificationsButton() {
    const { colors } = useColorScheme();
    const notifications = useNotifications(true);

    return (
        <Pressable className="relative flex-row items-center px-2" onPress={() => router.push('/notifications')}>
            <Bell size={24} strokeWidth={2} stroke={colors.foreground} />
            {notifications.length > 0 && <Indicator />}
        </Pressable>
    );
}

function Indicator() {
    return <View className="h-2 w-2 rounded-full bg-red-500" />;
}
