import { type NDKEvent, NDKKind, useProfileValue } from '@nostr-dev-kit/ndk-mobile';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { nip19 } from 'nostr-tools';
import type React from 'react';
import { useCallback } from 'react';
import { Linking, Pressable, Text } from 'react-native';

import * as User from '../user';

import { useSearchQuery } from '@/components/Headers/Home/store';

interface EventContentProps {
    event?: NDKEvent;
    content?: string;

    onMentionPress?: (pubkey: string) => void;
    onHashtagPress?: false | ((hashtag: string) => void);
}

function RenderEmoji({
    shortcode,
    event,
    fontSize,
}: { shortcode: string; event?: NDKEvent; fontSize?: number }) {
    if (!event) return <Text style={{ fontSize }}>:{shortcode}:</Text>;

    const emojiTag = event.tags.find((tag) => tag[0] === 'emoji' && tag[1] === shortcode);
    if (!emojiTag || !emojiTag[2]) return <Text style={{ fontSize }}>:{shortcode}:</Text>;

    const emojiSize = fontSize || 14;

    return (
        <Image
            source={{ uri: emojiTag[2] }}
            style={{ width: emojiSize, height: emojiSize, resizeMode: 'contain' }}
        />
    );
}

function RenderHashtag({
    hashtag,
    onHashtagPress,
    fontSize,
}: {
    hashtag: string;
    onHashtagPress?: false | ((hashtag: string) => void);
    fontSize?: number;
}) {
    if (onHashtagPress !== false) {
        onHashtagPress ??= () => {
            router.replace(`/search?q=${encodeURIComponent(`#${hashtag}`)}`);
        };
    }

    if (onHashtagPress) {
        return (
            <Text
                onPress={() => onHashtagPress(`#${hashtag}`)}
                style={{ fontSize }}
                className="font-bold text-primary"
            >
                #{hashtag}
            </Text>
        );
    }

    return (
        <Text style={{ fontSize }} className="font-bold text-primary">
            #{hashtag}
        </Text>
    );
}

function RenderMention({
    entity,
    onMentionPress,
    fontSize,
}: {
    entity: string | null;
    onMentionPress?: (pubkey: string) => void;
    fontSize?: number;
}) {
    const handlePress = useCallback(
        (pubkey: string) => {
            if (onMentionPress) onMentionPress(pubkey);
        },
        [onMentionPress]
    );

    let pubkey: string | undefined = undefined;

    if (entity) {
        try {
            const { type, data } = nip19.decode(entity);
            if (type === 'npub') pubkey = data as string;
            else if (type === 'nprofile') pubkey = (data as { pubkey: string }).pubkey;
        } catch (_e) {
            // Invalid entity, will render fallback
        }
    }

    const userProfile = useProfileValue(pubkey, { subOpts: { skipVerification: true } });

    if (!entity) return null;

    if (!pubkey) {
        return <Text style={{ fontSize }}>{entity.substring(0, 6)}...</Text>;
    }

    return (
        <Text
            style={{ fontSize }}
            className="font-bold text-primary"
            onPress={() => handlePress(pubkey as string)}
        >
            @<User.Name userProfile={userProfile} pubkey={pubkey} skipFlare />
        </Text>
    );
}

function RenderPart({
    part,
    onMentionPress,
    onHashtagPress,
    event,
    style,
    ...props
}: {
    part: string;
    onMentionPress?: (pubkey: string) => void;
    onHashtagPress?: (hashtag: string) => void;
    event?: NDKEvent;
    style?: any;
} & React.ComponentProps<typeof Text>) {
    const setSearchQuery = useSearchQuery();
    const defaultHashtagPress = useCallback(
        (tag: string) => {
            setSearchQuery(tag);
        },
        [setSearchQuery]
    );

    const fontSize = style?.fontSize;

    // Check for emoji shortcode
    const emojiMatch = part.match(/^:([a-zA-Z0-9_+-]+):$/);
    if (emojiMatch) {
        return <RenderEmoji shortcode={emojiMatch[1]} event={event} fontSize={fontSize} />;
    }

    if (part.startsWith('https://') && part.match(/\.(jpg|jpeg|png|gif)/)) {
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
    } else if (part.startsWith('https://') || part.startsWith('http://')) {
        return (
            <Text
                style={style}
                className="font-bold text-primary underline"
                onPress={() => Linking.openURL(part)}
            >
                {part}
            </Text>
        );
    }

    const mentionMatch = part.match(/nostr:([a-zA-Z0-9]+)/)?.[1];
    if (mentionMatch) {
        return (
            <RenderMention
                entity={mentionMatch}
                onMentionPress={onMentionPress}
                fontSize={fontSize}
            />
        );
    }

    const hashtagMatch = part.match(/^#([\p{L}\p{N}_\-]+)/u);
    if (hashtagMatch) {
        return (
            <RenderHashtag
                hashtag={hashtagMatch[1]}
                onHashtagPress={onHashtagPress || defaultHashtagPress}
                fontSize={fontSize}
            />
        );
    }

    return (
        <Text style={{ ...style, fontSize }} {...props}>
            {part}
        </Text>
    );
}

const EventContent: React.FC<EventContentProps & React.ComponentProps<typeof Text>> = ({
    event,
    numberOfLines,
    content,
    style,
    ...props
}: EventContentProps & React.ComponentProps<typeof Text>) => {
    content ??= event?.content ?? '';

    const parts = content.split(
        /(nostr:[^\s]+|https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif)|#[\w]+|:[a-zA-Z0-9_+-]+:)/
    );

    if (event?.kind === NDKKind.Reaction) {
        switch (event.content) {
            case '+':
            case '+1':
                return (
                    <Text style={style} {...props}>
                        ❤️
                    </Text>
                );
            case '-':
            case '-1':
                return (
                    <Text style={style} {...props}>
                        👎
                    </Text>
                );
            default:
                return (
                    <Text style={style} {...props}>
                        {event.content}
                    </Text>
                );
        }
    }

    const { onMentionPress, onHashtagPress, ...restProps } = props;

    return (
        <Text numberOfLines={numberOfLines} style={style} {...restProps}>
            {parts.map((part: string, index: number) => (
                <RenderPart
                    key={index}
                    part={part}
                    event={event}
                    style={style}
                    onMentionPress={onMentionPress}
                    onHashtagPress={onHashtagPress === false ? undefined : onHashtagPress}
                />
            ))}
        </Text>
    );
};

export default EventContent;
