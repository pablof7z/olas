import * as User from '@/components/ui/user';
import { useAtom, useAtomValue } from 'jotai';
import type React from 'react';
import { useCallback } from 'react';
import { TextInput } from 'react-native';
import { editProfileAtom, editStateAtom } from '../atoms';

type NameProps = {
    userProfile?: import('@nostr-dev-kit/ndk-mobile').NDKUserProfile;
    pubkey: string;
    colors: Record<string, string>;
};

const Name: React.FC<NameProps> = ({ userProfile, pubkey, colors }) => {
    const [editProfile, setEditProfile] = useAtom(editProfileAtom);
    const editState = useAtomValue(editStateAtom);

    const setName = useCallback(
        (text: string) => {
            setEditProfile({ ...editProfile, name: text });
        },
        [editProfile, setEditProfile]
    );

    if (editState === 'edit') {
        return (
            <TextInput
                value={editProfile?.name || ''}
                onChangeText={setName}
                style={{
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: 'bold',
                    borderWidth: 1,
                    borderColor: colors.grey3,
                    padding: 5,
                    margin: -6,
                    borderRadius: 5,
                    flex: 1,
                }}
            />
        );
    }

    return (
        <User.Name
            userProfile={userProfile}
            pubkey={pubkey}
            style={{ color: colors.foreground, fontSize: 16, fontWeight: 'bold' }}
        />
    );
};

export default Name;
