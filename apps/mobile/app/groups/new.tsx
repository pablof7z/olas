import {
    NDKEvent,
    NDKKind,
    NDKList,
    NDKRelaySet,
    useNDK,
    useNDKCurrentUser,
    // useNDKSessionEventKind, // Removed - needs replacement
    useProfile,
} from '@nostr-dev-kit/ndk-mobile';
import { useCallback, useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import { LargeTitleHeader } from '@/components/nativewindui/LargeTitleHeader';
import { SegmentedControl } from '@/components/nativewindui/SegmentedControl';
import { Text } from '@/components/nativewindui/Text';

export default function NewGroup() {
    const currentUser = useNDKCurrentUser();
    const userProfile = useProfile(currentUser?.pubkey);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [state, setState] = useState<'open' | 'closed'>('open');
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [relayUrl, setRelayUrl] = useState('wss://groups.0xchat.com');

    useEffect(() => {}, []);

    useEffect(() => {
        if (visibility === 'private') {
            setState('closed');
        }
    }, [visibility]);

    const insets = useSafeAreaInsets();

    const { ndk } = useNDK();
    const randomId =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    if (!ndk) {
        // Handle case where ndk is null, maybe return loading or error state
        console.error("NDK not available for group creation.");
        return <View><Text>Error: NDK not initialized.</Text></View>;
    }
    const relaySet = NDKRelaySet.fromRelayUrls([relayUrl], ndk, true);
    // const groupBookmark = useNDKSessionEventKind<NDKList>(NDKKind.SimpleGroupList, { // Commented out - needs replacement
    //     create: NDKList,
    // });
    const groupBookmark: NDKList | null = null; // Placeholder

    const createGroup = useCallback(() => {
        // ndk is checked above
        const create = new NDKEvent(ndk);
        create.kind = 9007;
        create.tags = [
            ['h', randomId],
            ['name', name],
            ['about', description],
            ['picture', userProfile?.image ?? ''],
            [state],
            [visibility],
        ];
        create.publish(relaySet).then(() => {
            // groupBookmark?.addItem(['group', randomId, relayUrl]); // Commented out - needs replacement
        });
    }, [name, description, visibility, state, relayUrl, ndk, randomId, userProfile?.image, relaySet]); // Added dependencies

    return (
        <KeyboardAwareScrollView
            className="flex-1 flex-col p-6"
            contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
            <View className="flex-1 flex-col items-stretch justify-between gap-6">
                <Text variant="title1">New Group</Text>

                <View className="flex-1 flex-col">
                    <TextInput
                        placeholder="Group Name"
                        value={name}
                        onChangeText={setName}
                        className="rounded-lg border border-border p-2 p-4 text-lg text-foreground"
                    />
                </View>

                <View className="flex-1 flex-col">
                    <TextInput
                        placeholder="Group Description"
                        value={description}
                        onChangeText={setDescription}
                        className="rounded-lg border border-border p-2 p-4 text-lg text-foreground"
                    />
                </View>

                <View className="flex-1 flex-col gap-2">
                    <Text variant="title2">Visibility</Text>

                    <SegmentedControl
                        values={['Members only', 'Public']}
                        selectedIndex={visibility === 'public' ? 1 : 0}
                        onValueChange={(value) =>
                            setVisibility(value === 'Members only' ? 'private' : 'public')
                        }
                    />

                    <View className="flex-1 flex-col">
                        {visibility === 'private' ? (
                            <Text>Only members can see the group content</Text>
                        ) : (
                            <Text>Non-members can see this group content</Text>
                        )}
                    </View>
                </View>

                {visibility === 'public' && (
                    <View className="flex-1 flex-col gap-2">
                        <Text variant="title2">Access</Text>

                        <SegmentedControl
                            values={['Anyone can join', 'Invite only']}
                            selectedIndex={state === 'closed' ? 1 : 0}
                            onValueChange={(value) =>
                                setState(value === 'Anyone can join' ? 'open' : 'closed')
                            }
                        />

                        <View className="flex-1 flex-col">
                            {state === 'closed' ? (
                                <Text>Group owners must approve new members</Text>
                            ) : (
                                <Text>Anyone can join this group</Text>
                            )}
                        </View>
                    </View>
                )}

                <View className="flex-1 flex-col gap-2">
                    <TextInput
                        placeholder="Relay URL"
                        value={relayUrl}
                        onChangeText={setRelayUrl}
                        className="rounded-lg border border-border p-2 p-4 text-lg text-foreground"
                    />
                </View>

                <View className="flex-1 flex-col gap-2" />

                <View className="flex-col items-stretch justify-between gap-6">
                    <Button size="lg" variant="primary" onPress={createGroup}>
                        <Text className="text-lg font-bold">Create Group</Text>
                    </Button>
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
}
