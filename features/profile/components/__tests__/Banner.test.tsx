import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import Banner from '../Banner';

// Mocks
const setEditProfileMock = jest.fn();
const openPickerMock = jest.fn(() => Promise.resolve({ path: 'mock-path' }));
const uploadMediaMock = jest.fn(() => Promise.resolve([{ uploadedUri: 'uploaded-uri' }]));
const prepareMediaMock = jest.fn(() => Promise.resolve([{ id: 'banner', uris: ['mock-path'] }]));
const toastErrorMock = jest.fn();

jest.mock('jotai', () => ({
    useAtom: () => [{ banner: 'banner-url' }, setEditProfileMock],
    useAtomValue: () => 'edit',
}));

jest.mock('expo-image', () => ({
    Image: (props: object) => <View testID="mock-image" {...props} />,
}));

jest.mock('@/lib/image-loader/hook', () => ({
    __esModule: true,
    default: () => ({ image: 'banner-url', status: 'loaded' }),
}));

jest.mock('@nostr-dev-kit/ndk-mobile', () => ({
    useProfileValue: () => ({ banner: 'banner-url' }),
    useNDK: () => ({ ndk: {} }),
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0 }),
}));

jest.mock('react-native-image-crop-picker', () => ({
    openPicker: openPickerMock,
}));

jest.mock('@/lib/publish/actions/upload', () => ({
    uploadMedia: uploadMediaMock,
}));

jest.mock('@/utils/media/prepare', () => ({
    prepareMedia: prepareMediaMock,
}));

jest.mock('@backpackapp-io/react-native-toast', () => ({
    toast: { error: toastErrorMock },
}));

jest.mock('lucide-react-native', () => ({
    ImageIcon: (props: object) => <Text testID="mock-image-icon" {...props} />,
}));

describe('Banner component', () => {
    const pubkey = 'abcdef123456';

    beforeEach(() => {
        setEditProfileMock.mockClear();
        openPickerMock.mockClear();
        uploadMediaMock.mockClear();
        prepareMediaMock.mockClear();
        toastErrorMock.mockClear();
    });

    it('renders edit mode with TouchableOpacity and overlay', () => {
        const { getByTestId } = render(<Banner pubkey={pubkey} />);
        expect(getByTestId('mock-image')).toBeTruthy();
        expect(getByTestId('mock-image-icon')).toBeTruthy();
    });

    it('calls image picker on press in edit mode', async () => {
        const { getByTestId } = render(<Banner pubkey={pubkey} />);
        const touchable = getByTestId('mock-image').parent;
        await fireEvent.press(touchable);
        expect(openPickerMock).toHaveBeenCalled();
    });

    it('renders view mode with Image only', () => {
        jest.spyOn(require('jotai'), 'useAtomValue').mockImplementation(() => 'view');
        const { getByTestId, queryByTestId } = render(<Banner pubkey={pubkey} />);
        expect(getByTestId('mock-image')).toBeTruthy();
        expect(queryByTestId('mock-image-icon')).toBeNull();
        jest.spyOn(require('jotai'), 'useAtomValue').mockRestore();
    });
});
