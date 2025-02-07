import { useAtom, useAtomValue } from "jotai";
import { userBottomSheetAtom } from "./store";
import { Sheet, useSheetRef } from "@/components/nativewindui/Sheet";
import { Dimensions, StyleProp, ViewStyle } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Text } from "@/components/nativewindui/Text";
import { useEffect, useCallback, useRef, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "@/components/nativewindui/Button";
import { ChevronRight, List, ListFilter, Lock, UserMinus, UserPlus, WheatIcon } from "lucide-react-native";
import { useColorScheme } from "../useColorScheme";
import { NDKUser, useMuteList, useNDK, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import * as User from "@/components/ui/user";
import usePrivateFollows from "@/stores/db/private-follows";
import { useFollowType } from "@/hooks/follows";
import FollowIcon from "@/components/icons/follow";
import PrivateFollowIcon from "@/components/icons/private-follow";
import Bookmark from "@/components/icons/bookmark";
import { feedEditorBottomSheetRefAtom, useFeedEditorStore } from "../feed-editor/store";
import { publishFollow } from "@/components/buttons/follow";

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
    
    const feedEditorRef = useAtomValue(feedEditorBottomSheetRefAtom);
    const feedEditorStore = useFeedEditorStore();
    const handleAddToCollection = useCallback(() => {
        feedEditorStore.setMode('edit');
        feedEditorStore.setPubkeys([user?.pubkey]);
        feedEditorRef.current?.present();
        feedEditorRef.current?.expand();
    }, [feedEditorRef, feedEditorStore, user?.pubkey]);

    const { ndk } = useNDK();

    

    const followType = useFollowType(user?.pubkey);

    return <Sheet ref={ref} onDismiss={handleDismiss}>
        <BottomSheetView style={styles.container}>
            {/* {userProfile && user && (
                <View style={styles.profileContainer}>
                    <User.Avatar pubkey={user.pubkey} userProfile={userProfile} imageSize={48} />

                    <View className="flex-col">
                        <User.Name userProfile={userProfile} pubkey={user.pubkey} className="font-bold text-foreground" />
                    </View>
                </View>
            )} */}
            <View style={styles.buttonContainer}>
                <FollowButton user={user} />

                <PrivateFollowButton user={user} style={styles.buttonItem} /> 
                
                {/* <Button variant="secondary"  onPress={handleAddToCollection}>
                    <Bookmark size={38} color1={colors.grey2} color2={colors.grey5} />
                    <View className="flex-col items-start flex-1">
                        <Text>Add to collection</Text>
                        <Text className="text-xs text-muted-foreground">
                            Add this user to a collection
                        </Text>
                    </View>
                    <ChevronRight size={38} color={colors.grey2} />
                </Button> */}
            </View>
        </BottomSheetView>
    </Sheet>
}

function Btn({ active, Icon, children, onPress }: { active: boolean, Icon: React.ComponentType<{ color1?: string, color2?: string, size: number }>, children: React.ReactNode, onPress: () => void }) {
    const { colors } = useColorScheme();

    return <Button variant={!active ? 'secondary' : 'tonal'} style={styles.buttonItem} onPress={onPress}>
        {active ? (
            <Icon size={38} />
        ) : (
            <Icon color1={colors.grey2} color2={colors.grey2} size={38} />
        )}
        {children}
    </Button>
}

function FollowButton({ user }: { user: NDKUser }) {
    const { ndk } = useNDK();
    const followType = useFollowType(user?.pubkey);

    const handleFollow = useCallback(() => {
        if (!user || !ndk) return;
        publishFollow(ndk, user.pubkey);
    }, [user?.pubkey, ndk]);

    return <Btn active={followType !== 'private'} Icon={FollowIcon} onPress={handleFollow}>
        <Text>Follow</Text>
    </Btn>
}
function PrivateFollowButton({ user, style }: { user: NDKUser, style: StyleProp<ViewStyle> }) {
    const addPrivateFollow = usePrivateFollows((state) => state.add);
    const removePrivateFollow = usePrivateFollows((state) => state.remove);
    const followType = useFollowType(user?.pubkey);
    
    const handlePrivateFollow = useCallback(() => {
        if (!user) return;
        if (followType === 'private') {
            removePrivateFollow(user.pubkey);
        } else {
            addPrivateFollow(user.pubkey);
        }
    }, [user?.pubkey, followType]);

    const active = followType === 'private';
    
    return (
        <Btn active={active} Icon={PrivateFollowIcon} onPress={handlePrivateFollow}>
            <View className="flex-col items-start">
                <Text>Private Follow</Text>
                <Text className="text-xs text-muted-foreground">
                    {active ? (
                        "You are currently following this user privately"
                    ) : (
                        "Follow this user without anyone knowing"
                    )}
                </Text>
            </View>
        </Btn>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 20,
        padding: 10,
        paddingBottom: 50,
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
        justifyContent: 'space-between',
        gap: 10,
        width: '100%',
    },

    largeButtonItem: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        padding: 10,
        width: 120,
        height: 120,
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