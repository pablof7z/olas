import EventContent from '@/components/ui/event/content';
import { useAtom, useAtomValue } from 'jotai';
import type React from 'react';
import { useCallback } from 'react';
import { Text, TextInput } from 'react-native';
import { editProfileAtom, editStateAtom } from '../atoms';
import styles from '../styles';

type AboutProps = {
    userProfile?: import('@nostr-dev-kit/ndk-mobile').NDKUserProfile;
    colors: Record<string, string>;
};

const About: React.FC<AboutProps> = ({ userProfile, colors }) => {
    const [editProfile, setEditProfile] = useAtom(editProfileAtom);
    const editState = useAtomValue(editStateAtom);

    const setAbout = useCallback(
        (text: string) => {
            setEditProfile({ ...editProfile, about: text });
        },
        [editProfile, setEditProfile]
    );

    if (editState === 'edit') {
        return (
            <TextInput
                value={editProfile?.about || ''}
                multiline
                onChangeText={setAbout}
                style={{
                    color: colors.foreground,
                    fontSize: 13,
                    borderWidth: 1,
                    minHeight: 100,
                    borderColor: colors.grey3,
                    padding: 10,
                    marginVertical: 10,
                    marginHorizontal: -6,
                    borderRadius: 5,
                    flex: 1,
                    width: '100%',
                }}
            />
        );
    }

    const about = editProfile?.about || userProfile?.about;

    if (!about) return null;

    return (
        <Text style={styles.bio} className="text-muted-foreground">
            <EventContent content={about} />
        </Text>
    );
};

export default About;
