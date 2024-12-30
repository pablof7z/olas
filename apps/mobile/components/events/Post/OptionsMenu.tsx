import { NDKEvent, NDKKind, NDKList, useNDKCurrentUser, useNDKSession, useNDKSessionEventKind, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { BottomSheetView, BottomSheetModal } from '@gorhom/bottom-sheet';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import * as Clipboard from 'expo-clipboard';
import { optionsMenuEventAtom, optionsSheetRefAtom } from './store';
import { useCallback, useEffect, useMemo } from "react";
import { Share } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, View } from 'react-native';
import { List, ListItem } from '~/components/nativewindui/List';
import { cn } from "@/lib/cn";
import * as User from '~/components/ui/user';
import { Button } from "@/components/nativewindui/Button";
import { Bookmark, Copy, Share as ShareIcon, Trash, UserX } from "lucide-react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import { toast } from "@backpackapp-io/react-native-toast";

const deletePost = (event: NDKEvent) => {
    event.delete(undefined, false).then(async (e) => {
        await e.sign();
        e.publish().then(console.log).catch(console.error)
    })
}

const copyId = async (event: NDKEvent) => {
    Clipboard.setStringAsync(event.encode());
    toast.success('Copied to clipboard');
}

const sharePost = async (event: NDKEvent) => {
    Share.share({
        url: 'https://olas.app/e/' + event.encode(),
    });
}

function OptionsContent({ event, sheetRef }: { event: NDKEvent, sheetRef: React.RefObject<BottomSheetModal> }) {
    const imageCurationSet = useNDKSessionEventKind<NDKList>(NDKList, NDKKind.ImageCurationSet, { create: true });
    const { mutePubkey } = useNDKSession();
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const inset = useSafeAreaInsets();

    const bookmark = async () => {
        if (imageCurationSet.has(event.id)) {
            await imageCurationSet.removeItemByValue(event.id);
        } else {
            await imageCurationSet.addItem(event);
        }
        await imageCurationSet.publishReplaceable();
    };

    const muteUser = useCallback(() => {
        mutePubkey(event.pubkey);
    }, [event.pubkey]);

    const close = useCallback((cb: (event?: NDKEvent) => void) => {
        sheetRef.current?.dismiss();
        cb(event);
    }, [sheetRef]);
    
    return (
        <BottomSheetView style={{ padding: 10, paddingBottom: inset.bottom + 20, flexDirection: 'column', gap: 20 }}>
            <View className="flex-row items-stretch justify-between h-20">
                <Button size="lg" variant="secondary" className="flex-col gap-2 items-center w-1/4" onPress={() => close(bookmark)}>
                    <Bookmark size={30} color={colors.foreground} />
                    <Text className="text-xs text-muted-foreground">Save</Text>
                </Button>

                <Button size="lg" variant="secondary" className="flex-col gap-2 items-center w-1/4" onPress={() => close(copyId)}>
                    <Copy size={30} color={colors.foreground} />
                    <Text className="text-xs text-muted-foreground">Copy</Text>
                </Button>

                <Button size="lg" variant="secondary" className="flex-col gap-2 items-center w-1/4" onPress={() => close(sharePost)}>
                    <ShareIcon size={30} color={colors.foreground} />
                    <Text className="text-xs text-muted-foreground">Share</Text>
                </Button>
            </View>
            
            <View className="flex-col items-start justify-start">
                {currentUser?.pubkey === event.pubkey ?
                    (
                        <Button size="lg" variant="secondary" className="flex-row gap-2 py-4 w-full bg-red-900/10" onPress={() => {
                            close(() => deletePost(event));
                            toast.success('Post marked for deletion');
                        }}>
                            <Trash size={24} color="red" />
                            <Text className="text-red-500 flex-1">Delete</Text>
                        </Button>
                    ) : (
                        <Button size="lg" variant="secondary" className="flex-row gap-2 py-4 w-full bg-red-900/10" onPress={muteUser}>
                            <UserX size={24} color="red" />
                            <Text className="text-red-500 flex-1">Mute User</Text>
                        </Button>
                    )}
            </View>
        </BottomSheetView>
    )
}

export default function PostOptionsMenu() {
    const sheetRef = useSheetRef();
    const setOptionsSheetRef = useSetAtom(optionsSheetRefAtom);
    const event = useAtomValue(optionsMenuEventAtom);
    
    useEffect(() => {
        setOptionsSheetRef(sheetRef);
    }, [sheetRef]);

    const content = useMemo(() => {
        return <OptionsContent event={event} sheetRef={sheetRef} />
    }, [sheetRef, event?.id]);

    return (
        <Sheet ref={sheetRef}>
            {event && content}
        </Sheet>
    )
}