import { useAtom } from "jotai";
import { userBottomSheetAtom } from "./store";
import { Sheet, useSheetRef } from "@/components/nativewindui/Sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Text } from "@/components/nativewindui/Text";
import { useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "@/components/nativewindui/Button";
import { ChevronRight, List, ListFilter, Lock, UserPlus, WheatIcon } from "lucide-react-native";
import { useColorScheme } from "../useColorScheme";
import { useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import * as User from "@/components/ui/user";

export default function BottomSheet() {
    const ref = useSheetRef();
    const [ user, setUser ] = useAtom(userBottomSheetAtom);

    const userProfile = useUserProfile(user?.pubkey);

    useEffect(() => {
        if (!ref) return;

        if (user) {
            ref.current?.present();
            ref.current?.expand();
        } else {
            ref.current?.collapse();
        }
    }, [ref, user]);

    const handleDismiss = useCallback(() => {
        setUser(null);
    }, [setUser]);

    const { colors } = useColorScheme();

    return <Sheet ref={ref} snapPoints={['50%']} onDismiss={handleDismiss}>
        <BottomSheetView style={styles.container}>
            {/* {userProfile && user && (
                <View style={styles.profileContainer}>
                    <User.Avatar pubkey={user.pubkey} userProfile={userProfile} imageSize={48} />

                    <View className="flex-col">
                        <User.Name userProfile={userProfile} pubkey={user.pubkey} className="font-bold text-foreground" />
                    </View>
                </View>
            )} */}
            <View style={styles.largeButtonsContainer}>

                <Button variant="secondary" style={styles.largeButtonItem}>
                    <UserPlus size={32} color={colors.muted} />
                    <Text>Follow</Text>
                </Button>
            </View>
            <View style={styles.buttonContainer}>
                <Button variant="secondary" style={styles.buttonItem}>
                    <Lock size={48} color={colors.muted} />
                    <View className="flex-col items-start">
                        <Text>Private Follow</Text>
                        <Text variant="caption1" className="text-muted-foreground text-sm">
                            Follow this user without anyone being able to see it
                        </Text>
                    </View>
                </Button>

                <Button variant="secondary" style={styles.buttonItem}>
                    <ListFilter size={48} color={colors.muted} />
                    <View className="flex-col items-start flex-1">
                        <Text>Add to collection</Text>
                        <Text variant="caption1" className="text-muted-foreground text-sm">
                            Add this user to a categorized collection
                        </Text>
                    </View>
                    <ChevronRight size={24} color={colors.muted} />
                </Button>
            </View>
        </BottomSheetView>
    </Sheet>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 20,
        padding: 10,
    },

    profileContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        width: '100%',
        alignItems: 'center',
        gap: 10,
        padding: 2,
    },

    largeButtonsContainer: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },

    largeButtonItem: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        padding: 10,
        gap: 10,
        width: 120,
        height: 100,
    },
    
    buttonContainer: {
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        flex: 1
    },
    buttonItem: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderRadius: 10,
        padding: 10,
        gap: 10,
    },
});