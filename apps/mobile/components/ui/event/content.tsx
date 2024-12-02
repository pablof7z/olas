import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { NDKEvent, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import * as User from '../user';
import { Image } from 'expo-image';
import { nip19 } from 'nostr-tools';

interface EventContentProps {
    event: NDKEvent;
    content?: string;

    onMentionPress?: (pubkey: string) => void;
}

const RenderMention = ({ entity, onMentionPress }: { entity: string | null; onMentionPress?: (pubkey: string) => void }) => {
    const pubkey = nip19.decode(entity).data as string;
    const { userProfile } = useUserProfile(pubkey);

    return (
        <Pressable onPress={() => onMentionPress?.(pubkey)}>
            <Text style={style.mention}>
                @<User.Name userProfile={userProfile} pubkey={pubkey} style={style.mention} />
            </Text>
        </Pressable>
    );
}

const RenderPart: React.FC<{ part: string } & React.ComponentProps<typeof Text>> = ({ part, ...props }) => {
    const { onMentionPress } = props as EventContentProps;

    if (part.startsWith('https://')) {
        return (
            <Pressable>
                <Image
                    source={{ uri: part }}
                    style={{
                        width: '100%',
                        height: '100%',
                        resizeMode: 'cover',
                        borderRadius: 12,
                    }}
                />
            </Pressable>
        );
    }

    const entity = part.match(/nostr:([a-zA-Z0-9]+)/)?.[1];
    if (!entity) {
        return <Text {...props}>{part}</Text>;
    }

    // if the entity is a user, return the user's profile
    if (entity.startsWith('npub')) {
        return (
            <RenderMention entity={entity} onMentionPress={onMentionPress} />
        );
    } else if (entity.startsWith('nprofile')) {
        let pubkey: string | undefined;
        try {
            const { data } = nip19.decode(entity) as {
                data: { pubkey: string };
            };
            pubkey = data.pubkey;
        } catch (e) {
            console.log({ entity, e });
            return <Text {...props}>{entity.substring(0, 6)}...</Text>;
        }

        return (
            <RenderMention entity={entity} onMentionPress={onMentionPress} />
        );
    }

    return <Text {...props}>{entity.substring(0, 6)}...</Text>;
};

const EventContent: React.FC<EventContentProps & React.ComponentProps<typeof View>> = ({ event, content, ...props }) => {
    content ??= event.content;
    const parts = content.split(/(nostr:[^\s]+|https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif))/);

    return (
        <Text {...props}>
            {parts.map((part: string, index: number) => (
                <RenderPart key={index} part={part} {...props} />
            ))}
        </Text>
    );
};

export default EventContent;

const style = StyleSheet.create({
    mention: {
        color: 'blue',
        fontWeight: '600',
    },
});
