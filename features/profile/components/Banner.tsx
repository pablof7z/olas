import useImageLoader from '@/lib/image-loader/hook';
import { uploadMedia } from '@/lib/publish/actions/upload';
import { prepareMedia } from '@/utils/media/prepare';
import { toast } from '@backpackapp-io/react-native-toast';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useProfileValue } from '@nostr-dev-kit/ndk-mobile';
import { Image } from 'expo-image';
import { useAtom, useAtomValue } from 'jotai';
import { ImageIcon } from 'lucide-react-native';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { Dimensions, type ImageStyle, type StyleProp, TouchableOpacity, View } from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { editProfileAtom, editStateAtom } from '../atoms';

type BannerProps = {
    pubkey: string;
};

const Banner: React.FC<BannerProps> = ({ pubkey }) => {
    const userProfile = useProfileValue(pubkey, { subOpts: { skipVerification: true } });
    const insets = useSafeAreaInsets();
    const [editProfile, setEditProfile] = useAtom(editProfileAtom);
    const editState = useAtomValue(editStateAtom);

    const width = Dimensions.get('window').width;
    const height = insets.top + 50 + 100; // headerStyles.leftContainer.height is assumed to be 50

    const { ndk } = useNDK();

    const handleChooseImage = useCallback(() => {
        ImageCropPicker.openPicker({
            width,
            height,
            cropping: true,
        }).then(async (image) => {
            setEditProfile({ ...editProfile, banner: image.path });

            // upload the image
            const media = await prepareMedia([
                { uris: [image.path], id: 'banner', mediaType: 'image', contentMode: 'landscape' },
            ]);
            if (!ndk) {
                toast.error('NDK not available to upload banner.');
                return;
            }
            const uploaded = await uploadMedia(media, ndk);
            if (!uploaded[0].uploadedUri) {
                toast.error('Failed to upload profile banner');
                return;
            }
            setEditProfile({ ...editProfile, banner: uploaded[0].uploadedUri });
        });
    }, [editProfile, setEditProfile, ndk]);

    const bannerImage = useImageLoader(userProfile?.banner ?? false);

    const imageStyle = useMemo(() => {
        const styles: StyleProp<ImageStyle> = {
            width: '100%',
            height: insets.top + 50 + 100,
        };

        if (bannerImage.status !== 'loaded') styles.backgroundColor = `#${pubkey.slice(0, 6)}`;

        return styles;
    }, [bannerImage.status, insets.top, pubkey]);

    if (editState === 'edit') {
        return (
            <TouchableOpacity
                onPress={handleChooseImage}
                style={{
                    width: '100%',
                    height,
                    backgroundColor: `#${pubkey.slice(0, 6)}`,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}
            >
                <Image
                    source={bannerImage.image}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: insets.top + 50 + 100,
                        flex: 1,
                    }}
                    contentFit="cover"
                />
                <View
                    style={{
                        position: 'absolute',
                        top: '50%',
                        marginTop: 20,
                        right: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000000bb',
                        borderRadius: 100,
                        width: 40,
                        height: 40,
                    }}
                >
                    <ImageIcon size={18} color="white" />
                </View>
            </TouchableOpacity>
        );
    }

    return <Image source={bannerImage.image} style={imageStyle} contentFit="cover" />;
};

export default Banner;
