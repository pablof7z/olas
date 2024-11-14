import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { Text } from '@/components/nativewindui/Text';
import * as User from '@/ndk-expo/components/user';
import { Image } from 'expo-image';
import { nip19 } from 'nostr-tools';

interface EventContentProps {
    event: NDKEvent;
    content?: string;
}

const RenderPart: React.FC<{ part: string }> = ({ part }) => {
    if (part.startsWith('https://')) {
        return (
            <Pressable>
                <Image
                    source={{ uri: part }}
                    style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 12 }}
                />
            </Pressable>
        )
    }
    
    const entity = part.match(/nostr:([a-zA-Z0-9]+)/)?.[1];
    if (!entity) {
        return <Text>{part}</Text>
    }

    // if the entity is a user, return the user's profile
    if (entity.startsWith('npub')) {
        return (
            <User.Profile npub={entity}>
                <Text style={ style.mention }>@<User.Name style={ style.mention } /></Text>
            </User.Profile>
        )
    } else if (entity.startsWith('nprofile')) {
        let pubkey: string | undefined;
        try {
            const {data} = nip19.decode(entity) as { data: { pubkey: string } };
            pubkey = data.pubkey;
        } catch (e) {
            console.log({entity, e});
            return <Text>{entity.substring(0, 6)}...</Text>
        }
        
        return (
            <User.Profile pubkey={pubkey}>
                <Text style={ style.mention }>@<User.Name style={ style.mention } /></Text>
            </User.Profile>
        )
    }

    return <Text>{entity.substring(0, 6)}...</Text>
}

const EventContent: React.FC<EventContentProps & React.ComponentProps<typeof View>> = ({ event, content, ...props }) => {
    content ??= event.content;
    const parts = content.split(/(nostr:[^\s]+|https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif))/);

    return (
        <Text {...props}>
            {parts.map((part: string, index: number) => (
                <RenderPart key={index} part={part} />
            ))}
        </Text>
    )
};

export default EventContent;

const style = StyleSheet.create({
    mention: {
        color: 'blue',
        fontWeight: '600',
    },
});
