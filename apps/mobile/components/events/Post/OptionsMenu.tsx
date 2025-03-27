import { toast } from '@backpackapp-io/react-native-toast';
import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import {
    NDKEvent,
    NDKKind,
    NDKList,
    type NDKUser,
    type NostrEvent,
    useMuteList,
    useNDK,
    useNDKCurrentUser,
    useNDKSessionEventKind,
} from '@nostr-dev-kit/ndk-mobile';
import * as Clipboard from 'expo-clipboard';
import { useAtomValue, useSetAtom } from 'jotai';
import { Bookmark, Code, Copy, Share as ShareIcon, Trash, UserX } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { optionsMenuEventAtom, optionsSheetRefAtom } from './store';

import { Button } from '@/components/nativewindui/Button';
import { useFollowType } from '@/hooks/follows';
import { useColorScheme } from '@/lib/useColorScheme';
import { useAppSettingsStore } from '@/stores/app';
import { Sheet, useSheetRef } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';

const deletePost = (event: NDKEvent) => {
    event.delete(undefined, false).then(async (e) => {
        await e.sign();
        e.publish().then(console.log).catch(console.error);
    });
};

const copyId = async (event: NDKEvent) => {
    Clipboard.setStringAsync(event.encode());
    toast.success('Copied to clipboard');
};

const copyRaw = async (event: NDKEvent) => {
    Clipboard.setStringAsync(JSON.stringify(event.rawEvent(), null, 4));
    toast.success('Copied raw event');
};

const sharePost = async (event: NDKEvent) => {
    Share.share({
        url: `https://olas.app/e/${event.encode()}`,
    });
};

function OptionsContent({
    event,
    sheetRef,
}: { event: NDKEvent; sheetRef: React.RefObject<BottomSheetModal> }) {
    const imageCurationSet = useNDKSessionEventKind<NDKList>(NDKKind.ImageCurationSet, {
        create: NDKList,
    });
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const inset = useSafeAreaInsets();
    const [showReport, setShowReport] = useState(false);
    const bookmark = async () => {
        if (imageCurationSet.has(event.id)) {
            await imageCurationSet.removeItemByValue(event.id);
        } else {
            await imageCurationSet.addItem(event);
        }
        await imageCurationSet.publishReplaceable();
    };

    const close = useCallback(
        (cb: (event?: NDKEvent) => void) => {
            sheetRef.current?.dismiss();
            cb(event);
        },
        [sheetRef]
    );

    const user = event?.author;

    const advancedMode = useAppSettingsStore((s) => s.advancedMode);

    return (
        <BottomSheetView
            style={{
                padding: 10,
                paddingBottom: inset.bottom + 20,
                flexDirection: 'column',
                gap: 20,
            }}
        >
            {showReport ? (
                <ReportBody event={event} />
            ) : (
                <>
                    <View className="h-20 flex-row items-stretch justify-stretch gap-4">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="grow flex-col items-center gap-2"
                            onPress={() => close(bookmark)}
                        >
                            <Bookmark size={30} color={colors.foreground} />
                            <Text className="text-xs text-muted-foreground">Bookmark</Text>
                        </Button>

                        <Button
                            size="lg"
                            variant="secondary"
                            className="grow flex-col items-center gap-2"
                            onPress={() => close(copyId)}
                        >
                            <Copy size={30} color={colors.foreground} />
                            <Text className="text-xs text-muted-foreground">Copy ID</Text>
                        </Button>

                        <Button
                            size="lg"
                            variant="secondary"
                            className="grow flex-col items-center gap-2"
                            onPress={() => close(sharePost)}
                        >
                            <ShareIcon size={30} color={colors.foreground} />
                            <Text className="text-xs text-muted-foreground">Share</Text>
                        </Button>
                    </View>

                    <View className="flex-col items-start justify-start gap-2">
                        {advancedMode && (
                            <Button
                                size="lg"
                                variant="secondary"
                                className="w-full flex-row gap-2 py-4"
                                onPress={() => close(copyRaw)}
                            >
                                <Code size={24} color={colors.muted} />
                                <Text className="flex-1 text-muted-foreground">Copy Raw</Text>
                            </Button>
                        )}

                        <DeletePostButton event={event} currentUser={currentUser} closeFn={close} />
                        <View className="flex-row gap-2">
                            <MuteButton user={user} currentUser={currentUser} closeFn={close} />

                            <Button
                                size="lg"
                                variant="secondary"
                                className="flex-1 flex-row gap-2 py-4"
                                onPress={() => setShowReport(true)}
                            >
                                <UserX size={24} color="red" />
                                <Text className="flex-1 text-red-500">Report</Text>
                            </Button>
                        </View>
                    </View>
                </>
            )}
        </BottomSheetView>
    );
}

function ReportBody({ event }: { event: NDKEvent }) {
    const { ndk } = useNDK();
    const [_sent, setSent] = useState(false);
    const { mute } = useMuteList();
    const optionsSheetRef = useAtomValue(optionsSheetRefAtom);

    const report = useCallback(
        async (reason: string) => {
            const report = new NDKEvent(ndk, {
                kind: NDKKind.Report,
            } as NostrEvent);
            report.tag(event, reason);
            for (const xTag of event.getMatchingTags('x')) {
                report.tags.push(['x', xTag[1]]);
            }
            await report.sign();
            report.publish();
            mute(event.pubkey, 'pubkey');
            setSent(true);
            optionsSheetRef.current?.dismiss();
        },
        [event?.id, optionsSheetRef]
    );

    return (
        <View>
            <Text variant="title1">Report</Text>
            <Text variant="body">Please describe the reason for reporting this post.</Text>

            <View className="my-4 flex-col gap-2">
                <View className="flex-row gap-2">
                    <Button variant="secondary" className="flex-1" onPress={() => report('nudity')}>
                        <Text>Nudity</Text>
                    </Button>

                    <Button variant="secondary" className="flex-1" onPress={() => report('spam')}>
                        <Text>Spam</Text>
                    </Button>
                </View>

                <View className="flex-row gap-2">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onPress={() => report('illegal')}
                    >
                        <Text>Illegal</Text>
                    </Button>

                    <Button variant="secondary" className="flex-1" onPress={() => report('other')}>
                        <Text>Other</Text>
                    </Button>
                </View>

                <View className="flex-row gap-2">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onPress={() => report('impersonation')}
                    >
                        <Text>Impersonation</Text>
                    </Button>

                    <Button variant="secondary" className="flex-1" onPress={() => report('other')}>
                        <Text>Other</Text>
                    </Button>
                </View>
            </View>
        </View>
    );
}

function DeletePostButton({
    event,
    currentUser,
    closeFn,
}: {
    event: NDKEvent;
    currentUser: NDKUser;
    closeFn: (cb: (event?: NDKEvent) => void) => void;
}) {
    if (currentUser?.pubkey !== event.pubkey) return null;

    return (
        <Button
            size="lg"
            variant="secondary"
            className="w-full flex-row gap-2 bg-red-900/10 py-4"
            onPress={() => {
                closeFn(() => deletePost(event));
                toast.success('Post marked for deletion');
            }}
        >
            <Trash size={24} color="red" />
            <Text className="flex-1 text-red-500">Delete</Text>
        </Button>
    );
}

function MuteButton({
    user,
    currentUser,
    closeFn,
}: {
    user: NDKUser;
    currentUser: NDKUser;
    closeFn: (cb: (event?: NDKEvent) => void) => void;
}) {
    const { mute } = useMuteList();
    const followType = useFollowType(user?.pubkey);

    if (currentUser?.pubkey === user.pubkey) return null;
    if (followType) return null;

    return (
        <Button
            size="lg"
            variant="secondary"
            className="flex-1 flex-row gap-2 bg-red-900/10 py-4"
            onPress={() => {
                closeFn(() => mute(user.pubkey, 'pubkey'));
            }}
        >
            <UserX size={24} color="red" />
            <Text className="flex-1 text-red-500">Mute</Text>
        </Button>
    );
}

function ReportUserButton({
    event,
    currentUser,
    closeFn,
}: {
    event: NDKEvent;
    currentUser: NDKUser;
    closeFn: (cb: (event?: NDKEvent) => void) => void;
}) {
    const { mute } = useMuteList();
    const followType = useFollowType(event?.pubkey);
    const user = event?.author;
    const { ndk } = useNDK();

    if (currentUser?.pubkey === event.pubkey) return null;
    if (followType) return null;

    const report = useCallback(() => {
        const r = new NDKEvent(ndk, {
            kind: NDKKind.Report,
            content: 'This user is spamming',
            tags: [['p', event.pubkey]],
        } as NostrEvent);
        r.publish();
    }, [event?.pubkey]);

    const handleBlock = useCallback(() => {
        mute(user.pubkey, 'pubkey');
        closeFn(undefined);
    }, [user.pubkey, report, closeFn]);

    return (
        <Button
            size="lg"
            variant="secondary"
            className="flex-1 flex-row gap-2 bg-red-900/10 py-4"
            onPress={handleBlock}
        >
            <UserX size={24} color="red" />
            <Text className="flex-1 text-red-500">Report</Text>
        </Button>
    );
}

export default function PostOptionsMenu() {
    const sheetRef = useSheetRef();
    const setOptionsSheetRef = useSetAtom(optionsSheetRefAtom);
    const event = useAtomValue(optionsMenuEventAtom);

    useEffect(() => {
        setOptionsSheetRef(sheetRef);
    }, [sheetRef]);

    const content = useMemo(() => {
        return <OptionsContent event={event} sheetRef={sheetRef} />;
    }, [sheetRef, event?.id]);

    return <Sheet ref={sheetRef}>{event && content}</Sheet>;
}
