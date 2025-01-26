import { Icon, MaterialIconName } from '@roninoss/icons';
import { cn } from "@/lib/cn";
import { View } from "react-native";

export function IconView({ className, name, children }: { className?: string; name?: MaterialIconName; children?: React.ReactNode }) {
    return (
        <View className="px-3">
            <View className={cn('h-6 w-6 items-center justify-center rounded-md', className)}>
                {name ? <Icon name={name} size={15} color="white" /> : children}
            </View>
        </View>
    );
}