import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { NDKEvent, NDKKind, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import * as User from '../user';
import { Image } from 'expo-image';
import { nip19 } from 'nostr-tools';
import { router } from 'expo-router';

interface EventContentProps {
    event: NDKEvent;
    content?: string;

    onMentionPress?: (pubkey: string) => void;
    onHashtagPress?: false | ((hashtag: string) => void);
}

function RenderHashtag({ hashtag, onHashtagPress }: { hashtag: string; onHashtagPress?: false | ((hashtag: string) => void) }) {
    if (onHashtagPress !== false) {
        onHashtagPress ??= () => router.push(`/search?q=${encodeURIComponent('#' + hashtag)}`);
    }

    if (onHashtagPress) {
        return (
            <Text onPress={() => onHashtagPress(hashtag)} className="font-bold text-primary">#{hashtag}</Text>
        );
    }

    return <Text className="font-bold text-primary">#{hashtag}</Text>;
}

function RenderMention({ entity, onMentionPress }: { entity: string | null; onMentionPress?: (pubkey: string) => void }) {
    try {
        const { type, data } = nip19.decode(entity);
        let pubkey: string;

        if (type === 'npub') pubkey = data;
        else if (type === 'nprofile') pubkey = data.pubkey;
        else return <Text>{entity.substring(0, 6)}...</Text>;

        const { userProfile } = useUserProfile(pubkey);

        return (
            <Text style={style.mention} onPress={() => onMentionPress?.(pubkey)}>
                @<User.Name userProfile={userProfile} pubkey={pubkey} style={style.mention} />
            </Text>
        );
    } catch (e) {
        return <Text>{entity.substring(0, 6)}...</Text>;
    }
}

// const RenderPart: React.FC<{ part: string } & React.ComponentProps<typeof Text>> = ({ part, ...props }) => {
//     const { onMentionPress } = props as EventContentProps;

//     if (part.startsWith('https://')) {
//         return (
//             <Pressable>
//                 <Image
//                     source={{ uri: part }}

//                     style={{
//                         width: '100%',
//                         height: '100%',
//                         resizeMode: 'cover',
//                         borderRadius: 12,
//                     }}
//                 />
//             </Pressable>
//         );
//     }

//     const entity = part.match(/nostr:([a-zA-Z0-9]+)/)?.[1];
//     if (!entity) {
//         return <Text {...props}>{part}</Text>;
//     }

//     // if the entity is a user, return the user's profile
//     if (entity.startsWith('npub')) {
//         return (
//             <RenderMention entity={entity} onMentionPress={onMentionPress} />
//         );
//     } else if (entity.startsWith('nprofile')) {
//         let pubkey: string | undefined;
//         try {
//             const { data } = nip19.decode(entity) as {
//                 data: { pubkey: string };
//             };
//             pubkey = data.pubkey;
//         } catch (e) {
//             console.log({ entity, e });
//             return <Text {...props}>{entity.substring(0, 6)}...</Text>;
//         }

//         return (
//             <RenderMention entity={entity} onMentionPress={onMentionPress} />
//         );
//     }

//     return <Text {...props}>{entity.substring(0, 6)}...</Text>;
// };

function RenderPart({
    part,
    onMentionPress,
    onHashtagPress,
    ...props
}: { part: string; onMentionPress?: (pubkey: string) => void; onHashtagPress?: (hashtag: string) => void } & React.ComponentProps<
    typeof Text
>) {
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

    const mentionMatch = part.match(/nostr:([a-zA-Z0-9]+)/)?.[1];
    if (mentionMatch) {
        return <RenderMention entity={mentionMatch} onMentionPress={onMentionPress} />;
    }

    const hashtagMatch = part.match(/^#(\w+)/);
    if (hashtagMatch) {
        return <RenderHashtag hashtag={hashtagMatch[1]} onHashtagPress={onHashtagPress} />;
    }

    return <Text {...props}>{part}</Text>;
}

const EventContent: React.FC<EventContentProps & React.ComponentProps<typeof View>> = ({ event, content, ...props }) => {
    content ??= event.content;

    const parts = content.split(/(nostr:[^\s]+|https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif)|#[\w]+)/);

    if (event.kind === NDKKind.Reaction) {
        switch (event.content) {
            case '+': case '+1': return <Text {...props}>❤️</Text>;
            case '-': case '-1': return <Text {...props}>👎</Text>;
            default: return <Text {...props}>{event.content}</Text>;
        }
    }

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
