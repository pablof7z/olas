import { NDKEvent, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import * as User from '@/components/ui/user';
import { View, StyleSheet, TextStyle } from 'react-native';
import EventContent from '@/components/ui/event/content';
import { UserProfile } from "@/hooks/user-profile";

export default function EventStickerGeneric({ event, userProfile, textStyle }: { event: NDKEvent, userProfile: UserProfile, textStyle: TextStyle }) {
    return (
        <View>
            <View style={styles.userContainer}>
                <User.Avatar 
                    pubkey={event.pubkey}
                    userProfile={userProfile}
                    imageSize={32}
                    style={styles.icon}
                />
                <User.Name 
                    userProfile={userProfile} 
                    pubkey={event.pubkey} 
                    style={textStyle}
                />
            </View>
            <EventContent 
                event={event}
                style={textStyle}
            />
        </View>
    );
}

const styles = StyleSheet.create({
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