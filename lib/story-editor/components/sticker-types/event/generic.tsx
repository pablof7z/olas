import type { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { Dimensions, StyleSheet, TextStyle, View } from 'react-native';

import type { EventStickerStyle } from './styles';

import EventContent from '@/components/ui/event/content';
import * as User from '@/components/ui/user';

export default function EventStickerGeneric({
    event,
    userProfile,
    styles,
}: {
    event: NDKEvent;
    userProfile?: NDKUserProfile;
    styles: EventStickerStyle;
}) {
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
                        <User.Name
                            userProfile={userProfile}
                            pubkey={event.pubkey}
                            style={styles.author.nameStyle}
                        />
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
