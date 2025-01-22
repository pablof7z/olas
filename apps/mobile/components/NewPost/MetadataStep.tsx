import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, TouchableOpacity, View } from 'react-native';
import { List, ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { cn } from '@/lib/cn';
import { useColorScheme } from '@/lib/useColorScheme';
import { router } from 'expo-router';
import { metadataAtom, selectedMediaAtom, stepAtom, uploadingAtom } from './store';
import { Fullscreen, MapPin, Tag, Timer, Type } from 'lucide-react-native';
import { SelectedMediaPreview } from './AlbumsView';
import { locationBottomSheetRefAtom } from './LocationBottomSheet';
import { communityBottomSheetRefAtom } from './CommunityBottomSheet';
import { tagSelectorBottomSheetRefAtom } from '../TagSelectorBottomSheet';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { generateEvent } from './event';
import { postTypeSheetRefAtom } from './PostTypeBottomSheet';
import { toast } from '@backpackapp-io/react-native-toast';
import Community from '@/components/icons/community';

export function PostMetadataStep() {
    const { ndk } = useNDK();
    const inset = useSafeAreaInsets();
    const postTypeSheetRef = useAtomValue(postTypeSheetRefAtom);
    const [selectedMedia, setSelectedMedia] = useAtom(selectedMediaAtom);
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const setStep = useSetAtom(stepAtom);
    const uploading = useAtomValue(uploadingAtom);
    const [wantsToPublish, setWantsToPublish] = useState(false);
    const publishing = useRef(false);

    useEffect(() => {
        if (!metadata.type) {
            postTypeSheetRef?.current?.present();
            postTypeSheetRef?.current?.expand({ duration: 1000 });
        }
    }, [postTypeSheetRef]);

    async function realPublish() {
        const {event, relaySet} = await generateEvent(ndk, metadata, selectedMedia);
        router.push('/');
        event.publish(relaySet).then(() => {
            setSelectedMedia([]);
            setMetadata({ caption: '', expiration: 0, type: 'high-quality' });
            setStep(0);
            publishing.current = false;
            setWantsToPublish(false);
        }).catch((e) => {
            console.error('error publishing event', e);
            toast.error('Error publishing event: ' + e.message);
        });
    }

    useEffect(() => {
        if (!uploading && wantsToPublish && !publishing.current) {
            publishing.current = true;
            realPublish();
        }
    }, [uploading, wantsToPublish, publishing]);

    const publish = useCallback(async () => {
        console.log('publish', { uploading, wantsToPublish, publishing });
        if (uploading) {
            setWantsToPublish(true);
            return;
        } else {
            realPublish();
        }
    }, [selectedMedia, metadata, uploading]);

    const busy = useMemo(() => (uploading || publishing) && wantsToPublish, [uploading, publishing, wantsToPublish]);

    useEffect(() => console.log({ uploading, publishing, wantsToPublish, busy }), [uploading, publishing, wantsToPublish, busy]);

    const [fullPreview, setFullPreview] = useState(false);
    const { colors } = useColorScheme();
    return (
        <View className="flex-1 grow" style={{ marginBottom: inset.bottom }}>
            <SelectedMediaPreview />

            <Button className="" variant="secondary" size="icon" onPress={() => setFullPreview(!fullPreview)}>
                <Fullscreen size={24} color={colors.foreground} />
            </Button>


            {!fullPreview && (
                <View className="grow flex-col justify-between px-4">
                    <PostOptions />
                </View>
            )}

            <View className="flex-col justify-between px-4">
                <Button variant="accent" onPress={publish} disabled={busy}>
                    {busy && <ActivityIndicator />}
                    <Text className="py-2 text-lg font-bold text-white">Publish</Text>
                </Button>
            </View>
        </View>
    );
}

function PostOptions() {
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const locationBottomSheetRef = useAtomValue(locationBottomSheetRefAtom);
    const communityBottomSheetRef = useAtomValue(communityBottomSheetRefAtom);
    const tagSelectorBottomSheetRef = useAtomValue(tagSelectorBottomSheetRefAtom);
    const { colors } = useColorScheme();
    const isUploading = useAtomValue(uploadingAtom);
    const selectedMedia = useAtomValue(selectedMediaAtom);
    const postTypeSheetRef = useAtomValue(postTypeSheetRefAtom);

    const openCaption = () => router.push('/publish/caption');
    const openExpiration = () => router.push('/publish/expiration');
    const openType = () => {
        postTypeSheetRef?.current?.present();
        postTypeSheetRef?.current?.expand();
    };

    const openLocation = () => {
        locationBottomSheetRef?.current?.present();
        locationBottomSheetRef?.current?.expand();
    };

    const openCommunity = () => {
        communityBottomSheetRef?.current?.present();
        communityBottomSheetRef?.current?.expand();
    };

    const openTags = () => {
        tagSelectorBottomSheetRef?.current?.present();
        tagSelectorBottomSheetRef?.current?.expand();
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
        if (metadata.type === undefined) metadata.type = 'high-quality';
        else if (metadata.location && metadata.removeLocation === undefined) openLocation();
    }, [metadata.type, metadata.location]);

    const data = useMemo(() => {
        const data = [
            {
                id: 'expiration',
                title: 'Expiration',
                subTitle: 'Delete post after some time',
                onPress: openExpiration,
                leftView: (
                    <View style={{ paddingHorizontal: 10 }}>
                        <Timer size={24} color={colors.muted} />
                    </View>
                ),
                rightView: (
                    <View className="flex-1 justify-center">
                        <Text className="text-sm text-muted-foreground">
                            {metadata.expiration ? `${calculateRelativeExpirationTimeInDaysOrHours(metadata.expiration)}` : 'None'}
                        </Text>
                    </View>
                ),
            },
            {
                id: 'type',
                title: 'Post type',
                subTitle: 'Choose the type of post',
                onPress: openType,
                leftView: (
                    <View style={{ paddingHorizontal: 10 }}>
                        <Type size={24} color={colors.muted} />
                    </View>
                ),
                rightView: (
                    <View className="flex-1 justify-center">
                        <Text className="text-sm text-muted-foreground">
                            {metadata.type === 'generic' && 'Generic'}
                            {metadata.type === 'high-quality' && 'High-quality'}
                        </Text>
                    </View>
                ),
            },
        ];

        if (metadata.location) {
            data.push({
                id: 'location',
                title: 'Location',
                onPress: openLocation,
                subTitle: metadata.location ? 'Photo coordinates' : 'Location not available',
                leftView: (
                    <View style={{ paddingHorizontal: 10 }}>
                        <MapPin size={24} color={colors.muted} />
                    </View>
                ),
                rightView: (
                    <View className="flex-1 justify-center">
                        <Text className="text-sm text-muted-foreground">
                            {metadata.removeLocation === true
                                ? 'Not published'
                                : metadata.location
                                    ? `${metadata.location.latitude}\n${metadata.location.longitude}`
                                    : 'None'}
                        </Text>
                    </View>
                ),
            });
        }

        data.unshift({
            id: 'tags',
            title: 'Tags',
            subTitle: 'Help people find your post',
            onPress: openTags,
            leftView: (
                <View style={{ paddingHorizontal: 10 }}>
                    <Tag size={24} color={colors.muted} />
                </View>
            ),
            rightView: (
                <View className="flex-1 justify-center">
                    <Text className="text-sm text-muted-foreground">
                        {metadata.tags?.length ?? 'None'}
                    </Text>
                </View>
            ),
        });

        // data.push({
        //     id: 'community',
        //     title: 'Community',
        //     onPress: openCommunity,
        //     leftView: (
        //         <View style={{ paddingHorizontal: 10 }}>
        //             <Community size={24} color={colors.muted} />
        //         </View>
        //     ),
        //     rightView: (
        //         <View className="flex-1 justify-center">
        //             <Text className="text-sm text-muted-foreground">
        //                 {metadata.group?.relays}
        //             </Text>
        //         </View>
        //     )
        // });

        return data;
    }, [metadata]);

    return (
        <View className="flex-1 bg-card">
            <TouchableOpacity onPress={openCaption} className="dark:border-border/80 mt-4 min-h-24 rounded-lg border border-border p-2">
                <Text className="text-sm text-foreground">{metadata.caption.trim().length > 0 ? metadata.caption : 'Add a caption'}</Text>
            </TouchableOpacity>

            <List
                data={data}
                contentContainerClassName="pt-4 bg-card"
                estimatedItemSize={59}
                contentInsetAdjustmentBehavior="automatic"
                renderItem={({ item, index, target }) => {
                    if (item.id === 'publish') {
                        return (
                            <Button size="lg" variant="accent" onPress={() => {}} disabled={isUploading || selectedMedia.length === 0}>
                                {isUploading ? <ActivityIndicator /> : <Text className="text-lg text-white">Publish</Text>}
                            </Button>
                        );
                    }

                    return (
                        <ListItem
                            className={cn('ios:pl-0 pl-2', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
                            item={item}
                            leftView={item.leftView}
                            rightView={item.rightView}
                            onPress={item.onPress}
                            index={index}
                            target={target}
                        />
                    );
                }}
            />
        </View>
    );
}
