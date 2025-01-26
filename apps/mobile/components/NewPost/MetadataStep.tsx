import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toggle } from '~/components/nativewindui/Toggle';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, TouchableOpacity, View } from 'react-native';
import { List, ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { cn } from '@/lib/cn';
import { useColorScheme } from '@/lib/useColorScheme';
import { router, useFocusEffect } from 'expo-router';
import { metadataAtom, selectedMediaAtom, selectingMediaAtom, stepAtom, uploadErrorAtom, uploadingAtom } from './store';
import { Fullscreen, Group, MapPin, Tag, Timer, Type, Users2, UsersIcon } from 'lucide-react-native';
import { SelectedMediaPreview } from './AlbumsView';
import { locationBottomSheetRefAtom } from './LocationBottomSheet';
import { communityBottomSheetRefAtom } from './CommunityBottomSheet';
import { tagSelectorBottomSheetRefAtom } from '../TagSelectorBottomSheet';
import { NDKEvent, NDKKind, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { generateEvent } from './event';
import { boostSheetRefAtom } from './BoostBottomSheet';
import { toast } from '@backpackapp-io/react-native-toast';
import Community from '@/components/icons/community';
import { prepareMedia } from './prepare';
import { uploadMedia } from './upload';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { MediaLibraryItem } from './MediaPreview';
import { useGroup } from '@/lib/groups/store';
import { Image } from 'expo-image';
import { useNewPost } from '@/hooks/useNewPost';

export function PostMetadataStep() {
    const { ndk } = useNDK();
    const inset = useSafeAreaInsets();
    const [selectedMedia, setSelectedMedia] = useAtom(selectedMediaAtom);
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const setUploadError = useSetAtom(uploadErrorAtom);
    const setStep = useSetAtom(stepAtom);
    const [uploading, setUploading] = useAtom(uploadingAtom);
    const [wantsToPublish, setWantsToPublish] = useState(true);
    const publishing = useRef(false);
    const { imagePicker: newPost } = useNewPost();
    const openedImagePicker = useRef(false);

    // when the component is visible:
    // useFocusEffect(() => {
    //     console.log('focus running', selectedMedia.length, openedImagePicker.current);
    //     if (selectedMedia.length === 0 && !openedImagePicker.current) {
    //         console.log('opening image picker');
    //         openedImagePicker.current = true;
    //         setTimeout(() => {
    //             newPost({ types: ['images', 'videos'] });
    //         }, 300);
    //         setTimeout(() => {
    //             openedImagePicker.current = false;
    //         }, 6000);
    //     }

    //     return () => {
    //         console.log('focus ended');
    //     };
    // });

    async function realPublish(uploadedMedia: MediaLibraryItem[] = selectedMedia) {
        const {event, relaySet} = await generateEvent(ndk, metadata, uploadedMedia);

        await event.sign();

        event.publish(relaySet).then(() => {
            setSelectedMedia([]);
            setMetadata({ caption: '', expiration: 0 });
            setStep(0);
            publishing.current = false;
            setWantsToPublish(false);

            if (metadata.boost) {
                const boost = new NDKEvent(ndk);
                boost.kind = NDKKind.Text;
                boost.content = "nostr:" + event.encode();
                boost.tag(event, "mention", false, "q");
                boost.publish().then(() => console.log('boost', boost.encode()));
            }
        }).catch((e) => {
            console.error('error publishing event', e);
            setUploadError(e.message);
            toast.error('Error publishing event: ' + e.message);
        });
    }

    // useEffect(() => {
    //     if (!uploading && wantsToPublish && !publishing.current) {
    //         publishing.current = true;
    //         realPublish();
    //     }
    // }, [uploading, wantsToPublish, publishing]);

    const activeBlossomServer = useActiveBlossomServer();

    const publish = useCallback(async () => {
        router.back();  

        try {
            setUploading(true);
            const start = performance.now();
            const preparedMedia = await prepareMedia(selectedMedia);
            console.log('preparedMedia', preparedMedia, performance.now() - start);
            const uploadedMedia = await uploadMedia(preparedMedia, ndk, activeBlossomServer);
            console.log('uploadedMedia', uploadedMedia, performance.now() - start);
            setUploading(false);
            setSelectedMedia(uploadedMedia);
            await realPublish(uploadedMedia);
        } catch (error) {
            console.error('Error publishing event', error);
            toast.error('Error publishing event: ' + error.message);
            setUploading(false);
        }
    }, [selectedMedia, metadata, uploading]);

    const busy = useMemo(() => (uploading || publishing.current) && wantsToPublish, [uploading, publishing, wantsToPublish]);
    const selecting = useAtomValue(selectingMediaAtom);

    return (
        <View className="flex-1 grow" style={{ marginBottom: inset.bottom }}>
            <SelectedMediaPreview>
                {selecting && <ActivityIndicator />}
            </SelectedMediaPreview>

            <View className="grow flex-col justify-between px-4">
                <PostOptions />
            </View>

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
    const { colors } = useColorScheme();
    const isUploading = useAtomValue(uploadingAtom);
    const selectedMedia = useAtomValue(selectedMediaAtom);
    const boostSheetRef = useAtomValue(boostSheetRefAtom);

    const openCaption = () => router.push('/publish/caption');
    const openExpiration = () => router.push('/publish/expiration');
    const openType = () => {
        boostSheetRef?.current?.present();
        boostSheetRef?.current?.expand();
    };

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

    const group = useGroup(metadata.group?.groupId, metadata.group?.relays?.[0]);

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
                title: 'Boost',
                subTitle: 'Make your post visible in incompatible nostr apps',
                onPress: openType,
                leftView: (
                    <View style={{ paddingHorizontal: 10 }}>
                        <Type size={24} color={colors.muted} />
                    </View>
                ),
                rightView: (
                    <View className="flex-1 justify-center">
                        <Toggle value={metadata.boost} onValueChange={(value) => setMetadata({ ...metadata, boost: value })} />
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

        // data.push({
        //     id: 'community',
        //     title: 'Community',
        //     subTitle: group?.name ? `Publish to ${group.name}` : 'Publish to a community',
        //     onPress: openCommunity,
        //     leftView: (
        //         <View style={{ paddingHorizontal: 10 }}>
        //             <Users2 size={24} stroke={colors.muted} />
        //         </View>
        //     ),
        //     rightView: (
        //         group && (
        //             <View className="justify-center flex-row items-center gap-2 mr-2 h-full">
        //                 {(group.picture ? (
        //                     <Image source={{ uri: group.picture }} style={{ width: 32, height: 32, borderRadius: 10 }} />
        //                 ) : (
        //                     <Text className="text-sm text-muted-foreground">{group.name}</Text>
        //                 ))}
        //             </View>
        //         )
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
