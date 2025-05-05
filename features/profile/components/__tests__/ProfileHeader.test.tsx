import { render } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import ProfileHeader from '../ProfileHeader';

// Mocks for subcomponents
jest.mock('./Banner', () => (props: object) => <View testID="mock-banner" {...props} />);
jest.mock('./Name', () => (props: object) => <View testID="mock-name" {...props} />);
jest.mock('./About', () => (props: object) => <View testID="mock-about" {...props} />);
jest.mock('./CopyToClipboard', () => (props: object) => <View testID="mock-copy" {...props} />);
jest.mock('./StoriesContainer', () => (props: object) => <View testID="mock-stories" {...props} />);
jest.mock('@/components/buttons/follow', () => (props: object) => (
    <View testID="mock-follow" {...props} />
));
jest.mock('@/components/ui/user', () => ({
    Avatar: (props: object) => <View testID="mock-avatar" {...props} />,
}));

jest.mock('react-native-reanimated', () => {
    const Actual = jest.requireActual('react-native-reanimated');
    return {
        ...Actual,
        useAnimatedStyle: () => ({}),
        useDerivedValue: () => ({ value: 90 }),
        interpolate: (v: number) => v,
        Extrapolate: { CLAMP: 'clamp' },
        createAnimatedComponent: (Component: any) => Component,
    };
});

jest.mock('@nostr-dev-kit/ndk-hooks', () => ({
    useEvent: () => ({
        tags: [
            ['p', 'pk1'],
            ['p', 'pk2'],
        ],
        id: 'evt1',
    }),
    useObserver: () => [{}, {}],
}));

jest.mock('@/lib/useColorScheme', () => ({
    useColorScheme: () => ({ colors: { foreground: '#000', muted: '#888' } }),
}));

jest.mock('@/utils/user', () => ({
    prettifyNip05: (nip05: string) => `pretty:${nip05}`,
}));

describe('ProfileHeader', () => {
    const pubkey = 'abcdef123456';
    const userProfile = { nip05: 'user@domain.com' };
    const colors = { foreground: '#000', muted: '#888' };
    const scrollY = { value: 0 };
    const insets = { top: 0 };

    it('renders all key subcomponents and stats', () => {
        const { getByTestId, getAllByText } = render(
            <ProfileHeader
                pubkey={pubkey}
                userProfile={userProfile as any}
                colors={colors}
                followCount={2}
                scrollY={scrollY as any}
                insets={insets}
            />
        );
        expect(getByTestId('mock-banner')).toBeTruthy();
        expect(getByTestId('mock-avatar')).toBeTruthy();
        expect(getByTestId('mock-name')).toBeTruthy();
        expect(getByTestId('mock-copy')).toBeTruthy();
        expect(getByTestId('mock-about')).toBeTruthy();
        expect(getByTestId('mock-stories')).toBeTruthy();
        expect(getByTestId('mock-follow')).toBeTruthy();
        // Stats: Posts and Following
        expect(getAllByText('Posts').length).toBeGreaterThan(0);
        expect(getAllByText('Following').length).toBeGreaterThan(0);
        // Pretty nip05
        expect(getAllByText('pretty:user@domain.com').length).toBeGreaterThan(0);
    });
});
