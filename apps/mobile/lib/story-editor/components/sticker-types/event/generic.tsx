import { NDKEvent, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import * as User from '@/components/ui/user';
import { View, StyleSheet, TextStyle, Dimensions } from 'react-native';
import EventContent from '@/components/ui/event/content';
import { UserProfile } from '@/hooks/user-profile';
import { EventStickerStyle } from './styles';

export default function EventStickerGeneric({
    event,
    userProfile,
    styles,
}: {
    event: NDKEvent;
    userProfile?: UserProfile;
    styles: EventStickerStyle;
}) {
    console.log('event', event);
    let content = event.content;
    if (content.trim().length === 0 && event.alt) content = event.alt;
    if (content.trim().length === 0) content = event.kind.toString();

    return (
        <View>
            {styles.author && (
                <View style={_styles.userContainer}>
                    {styles.author.avatarStyle && (
                        <User.Avatar
                            pubkey={event.pubkey}
                            userProfile={userProfile}
                            imageSize={styles.author.avatarStyle.width as number}
                            style={[_styles.icon]}
                        />
                    )}
                    {styles.author.nameStyle && (
                        <User.Name userProfile={userProfile} pubkey={event.pubkey} style={styles.author.nameStyle} />
                    )}
                </View>
            )}
            <EventContent event={event} content={content} style={[_styles.text, styles.text]} />
        </View>
    );
}

const _styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 16,
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        marginRight: 6,
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
