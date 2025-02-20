import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Switch, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { useColorScheme } from '@/lib/useColorScheme';
import { router } from 'expo-router';
import { MapPin, Repeat, Timer, Users2 } from 'lucide-react-native';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { MediaPreview } from './MediaPreview';
import { useGroup } from '@/lib/groups/store';
import { communityBottomSheetRefAtom, locationBottomSheetRefAtom, usePostEditorStore } from '../store';
import { GroupEntry } from '@/lib/groups/types';
import { COMMUNITIES_ENABLED, PUBLISH_ENABLED } from '@/utils/const';
import { mountTagSelectorAtom, tagSelectorBottomSheetCbAtom, tagSelectorBottomSheetRefAtom, TagSelectorSheetRefAtomType } from '@/components/TagSelectorBottomSheet';

export default function MainScreen() {
    const isSelecting = usePostEditorStore(s => s.selecting);
    const height = Dimensions.get('screen').height * 0.5

    return (
        <View className="flex-1 flex-col justify-between">
            <View style={{ flex: 1,position: 'relative' }}>
                <MediaPreview>
                    {isSelecting && <ActivityIndicator />}
                </MediaPreview>
            </View>

            <PostOptions />

            <Actions />
        </View>
    );
}

function Actions() {
    const { ndk } = useNDK();
    const readyToPublish = usePostEditorStore(s => s.readyToPublish);
    const uploading = usePostEditorStore(s => s.state === 'uploading');
    const busy = useMemo(() => (uploading) && readyToPublish, [uploading, readyToPublish]);
    const publish = usePostEditorStore(s => s.publish);
    const activeBlossomServer = useActiveBlossomServer();
    const setReadyToPublish = usePostEditorStore(s => s.setReadyToPublish);
    const tagSelectorBottomSheetRef = useAtomValue<TagSelectorSheetRefAtomType>(tagSelectorBottomSheetRefAtom);
    const [mountTagSelector, setMountTagSelector] = useAtom(mountTagSelectorAtom);
    const setTagSelectorCb = useSetAtom(tagSelectorBottomSheetCbAtom);
    const metadata = usePostEditorStore(s => s.metadata);
    const setMetadata = usePostEditorStore(s => s.setMetadata);

    const publishCb = useCallback(() => {
        setReadyToPublish(true);
        publish(ndk, activeBlossomServer);
        if (router.canGoBack()) router.back();
        else router.replace("/(home)");
    }, [publish, ndk, activeBlossomServer]);

    const shownTagSelector = useRef(false);

    const tagSelectorCb = useCallback((tags: string[]) => {
        if (tags.length) {
            let caption = metadata.caption.trim();
            if (caption.length > 0) caption += '\n\n';
            caption += tags.map(tag => `#${tag}`).join(' ');
            setMetadata({ ...metadata, caption });
        }
        tagSelectorBottomSheetRef?.current?.dismiss();
        publishCb();
    }, [metadata, setMetadata, tagSelectorBottomSheetRef?.current]);
    
    const handlePublish = useCallback(() => {
        if (!mountTagSelector) setMountTagSelector(true);
        if (!shownTagSelector.current) {
            const hasTags = metadata.caption.match(/#(\w+)/g);
            if (!hasTags) {
                setTagSelectorCb(tagSelectorCb);
                tagSelectorBottomSheetRef?.current?.present();
                tagSelectorBottomSheetRef?.current?.expand();
                shownTagSelector.current = true;
                return;
            }
        }

        shownTagSelector.current = false;

        publishCb();
    }, [publish, ndk, activeBlossomServer, tagSelectorCb])
    
    return (<View className="flex-col justify-between px-4">
        <Button variant="accent" onPress={handlePublish} disabled={busy}>
            {busy && <ActivityIndicator />}
            <Text className="py-2 text-lg font-bold text-white">Publish</Text>
        </Button>
    </View>);
}

function PostOptions() {
    const metadata = usePostEditorStore(s => s.metadata);   
    const locationBottomSheetRef = useAtomValue(locationBottomSheetRefAtom);
    const communityBottomSheetRef = useAtomValue(communityBottomSheetRefAtom);
    const { colors } = useColorScheme();
    const selectedMedia = usePostEditorStore(s => s.media);
    const setMetadata = usePostEditorStore(s => s.setMetadata);

    const openCaption = () => router.push('/(publish)/caption');
    const openExpiration = () => router.push('/(publish)/expiration');

    const openLocation = () => {
        locationBottomSheetRef?.current?.present();
        locationBottomSheetRef?.current?.expand();
    };

    const openCommunity = () => {
        communityBottomSheetRef?.current?.present();
        communityBottomSheetRef?.current?.expand();
    };

    const calculateRelativeExpirationTimeInDaysOrHours = (expiration: number) => {
        const now = new Date().getTime() - 600 * 1000;
        const diff = expiration - now;
        if (diff >= 1000 * 60 * 60 * 24) {
            return `${Math.round(diff / (1000 * 60 * 60 * 24))} days`;
        }
        return `${Math.round(diff / (1000 * 60 * 60))} hours`;
    };

    useEffect(() => {
        // find a location
        const location = selectedMedia.find((m) => m.location)?.location;
        if (location && !metadata.location) setMetadata({ ...metadata, location });
    }, [selectedMedia]);

    useEffect(() => {
        if (metadata.location && metadata.removeLocation === undefined) openLocation();
    }, [metadata.location]);

    let group: GroupEntry;
    if (COMMUNITIES_ENABLED) {
        group = useGroup(metadata.groups?.[0]?.groupId, metadata.groups?.[0]?.relayUrls?.[0]);
    }

    return (
        <View className="bg-card p-4 flex-col gap-2 flex-1">
            <TouchableOpacity onPress={openCaption} className="dark:border-border/80 rounded-lg border border-border p-2 mb-2" style={{ maxHeight: 200, minHeight: 80 }}>
                <Text className="text-sm text-foreground">{metadata.caption.trim().length > 0 ? metadata.caption : 'Add a caption'}</Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-4">
                <Timer size={30} color={colors.foreground} />

                <TouchableOpacity className="flex-1 flex-row items-center justify-between" onPress={openExpiration}>
                    <View className="flex-1 flex-col items-start">
                        <Text className="text-base font-semibold text-foreground">Expiration</Text>
                        <Text className="text-sm text-muted-foreground">Delete post after some time</Text>
                    </View>
                    {metadata.expiration && <Text className="text-sm text-muted-foreground">In {calculateRelativeExpirationTimeInDaysOrHours(metadata.expiration)}</Text>}
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center gap-4">
                <Repeat size={30} color={colors.foreground} />

                <Pressable className="flex-1 flex-col items-start" onPress={() => setMetadata({ ...metadata, boost: !metadata.boost })}>
                    <Text className="text-base font-semibold text-foreground">Share</Text>
                    <Text className="text-sm text-muted-foreground">Share your post in microblogging nostr apps</Text>
                </Pressable>

                <Switch value={metadata.boost} onValueChange={(value) => setMetadata({ ...metadata, boost: value })} />
            </View>

            {metadata.location && (
                <View className="flex-row items-center gap-4">
                    <MapPin size={24} color={colors.foreground} />

                    <TouchableOpacity className="flex-1 flex-col items-start" onPress={openLocation}>
                        <Text className="text-base font-semibold text-foreground">Location</Text>
                        <Text className="text-sm text-muted-foreground">Photo coordinates</Text>
                    </TouchableOpacity>
                </View>
            )}

            {COMMUNITIES_ENABLED && (
                <View className="flex-row items-center gap-4">
                    <Users2 size={24} color={colors.foreground} />

                    <TouchableOpacity className="flex-1 flex-col items-start" onPress={openCommunity}>
                        <Text className="text-base font-semibold text-foreground">Community</Text>
                        <Text className="text-sm text-muted-foreground">Publish to a community</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
