import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';

// Mock the dependencies
jest.mock('react-native-keyboard-controller', () => ({
    KeyboardAvoidingView: 'KeyboardAvoidingView'
}));

// Mock the store
const mockAddSticker = jest.fn();
const mockUpdateStickerValue = jest.fn();
const mockSetEditSticker = jest.fn();

jest.mock('../../../store', () => ({
    useStickerStore: () => ({
        addSticker: mockAddSticker,
        updateStickerValue: mockUpdateStickerValue
    }),
    editStickerAtom: 'mocked-atom'
}));

// Mock jotai
jest.mock('jotai', () => ({
    useAtom: () => [null, mockSetEditSticker],
}));

// Import the component after all mocks are set up
import TextStickerInput from '../input';

// Create a wrapper with SafeAreaProvider for all tests
const renderWithSafeArea = (ui: React.ReactElement) => {
    return render(
        <SafeAreaProvider
            initialMetrics={{
                frame: { x: 0, y: 0, width: 390, height: 844 },
                insets: { top: 47, left: 0, right: 0, bottom: 34 },
            }}
        >
            {ui}
        </SafeAreaProvider>
    );
};

describe('TextStickerInput', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { getByPlaceholderText, getByText } = renderWithSafeArea(<TextStickerInput />);
        
        // Verify elements render
        expect(getByPlaceholderText('Enter text here')).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
        expect(getByText('Done')).toBeTruthy();
    });

    it('handles text input correctly', () => {
        const { getByPlaceholderText } = renderWithSafeArea(<TextStickerInput />);
        const input = getByPlaceholderText('Enter text here');
        
        // Enter text
        fireEvent.changeText(input, 'Hello world');
        
        // Verify input text is updated
        expect(input.props.value).toBe('Hello world');
    });

    it('creates a new sticker when done is pressed', () => {
        const { getByText, getByPlaceholderText } = renderWithSafeArea(<TextStickerInput />);
        
        // Enter text
        fireEvent.changeText(getByPlaceholderText('Enter text here'), 'New sticker text');
        
        // Press the done button
        fireEvent.press(getByText('Done'));
        
        // Verify addSticker was called with correct params
        expect(mockAddSticker).toHaveBeenCalledWith({
            type: NDKStoryStickerType.Text,
            value: 'New sticker text',
            styleId: 'default'
        });
        
        // Verify edit atom was cleared
        expect(mockSetEditSticker).toHaveBeenCalledWith(null);
    });

    it('uses "Tap to edit" as default text when empty', () => {
        const { getByText } = renderWithSafeArea(<TextStickerInput />);
        
        // Press the done button without entering text
        fireEvent.press(getByText('Done'));
        
        // Verify addSticker was called with default text
        expect(mockAddSticker).toHaveBeenCalledWith({
            type: NDKStoryStickerType.Text,
            value: 'Tap to edit',
            styleId: 'default'
        });
    });

    it('cancels editing when cancel is pressed', () => {
        const { getByText } = renderWithSafeArea(<TextStickerInput />);
        
        // Press the cancel button
        fireEvent.press(getByText('Cancel'));
        
        // Verify edit atom was cleared
        expect(mockSetEditSticker).toHaveBeenCalledWith(null);
        
        // Verify sticker functions were not called
        expect(mockAddSticker).not.toHaveBeenCalled();
        expect(mockUpdateStickerValue).not.toHaveBeenCalled();
    });
});

// Test updating an existing sticker separately
describe('TextStickerInput with existing sticker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock jotai with an existing sticker
        jest.spyOn(require('jotai'), 'useAtom').mockReturnValue([
            {
                id: 'test-id',
                type: NDKStoryStickerType.Text,
                value: 'Original text',
                transform: {
                    translateX: 100,
                    translateY: 100,
                    scale: 1,
                    rotate: 0
                }
            },
            mockSetEditSticker
        ]);
    });
    
    it('updates existing sticker when done is pressed', () => {
        const { getByText, getByPlaceholderText } = renderWithSafeArea(<TextStickerInput />);
        
        // Verify input has initial value from existing sticker
        expect(getByPlaceholderText('Enter text here').props.value).toBe('Original text');
        
        // Change text
        fireEvent.changeText(getByPlaceholderText('Enter text here'), 'Updated text');
        
        // Press the done button
        fireEvent.press(getByText('Done'));
        
        // Verify updateStickerValue was called with correct params
        expect(mockUpdateStickerValue).toHaveBeenCalledWith('test-id', 'Updated text');
        
        // Verify edit atom was cleared
        expect(mockSetEditSticker).toHaveBeenCalledWith(null);
    });
}); 