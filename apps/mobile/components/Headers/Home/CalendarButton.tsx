import { useObserver } from "@/hooks/observer";
import { useColorScheme } from "@/lib/useColorScheme";
import { useNDKCurrentUser, NDKKind } from "@nostr-dev-kit/ndk-mobile";
import { router } from "expo-router";
import { Calendar } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { Pressable } from "react-native";

export default function CalendarButton() {
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const observer = useObserver(currentUser ? [
        { kinds: [NDKKind.Image], authors: [ currentUser.pubkey ], "#t": ["olas365"] }
    ] : false, {}, [currentUser?.pubkey])

    const press = useCallback(() => {
        router.push('/365')
    }, [])

    const hasEvents = useMemo(() => observer.length > 0, [observer.length])

    if (!hasEvents) return null;
    
    return <Pressable onPress={press} className="px-2">
        <Calendar size={24} color={colors.foreground} />
    </Pressable>
}