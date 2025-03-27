import { render, fireEvent, screen } from '@testing-library/react-native';
import React, { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import StoryPreview from '../app/story/preview';

// Mock console.log to avoid noise in test output
const originalConsoleLog = console.log;
console.log = jest.fn();

// Create a wrapper with SafeAreaProvider for all tests
const renderWithSafeArea = (ui: React.ReactElement) => {
    return render(
        <SafeAreaProvider
            initialMetrics={{
                frame: { x: 0, y: 0, width: 390, height: 844 },
                insets: { top: 47, left: 0, right: 0, bottom: 34 },
            }}>
            {ui}
        </SafeAreaProvider>
    );
};

describe('StoryPreview', () => {
    const mockProps = {
        path: '/test/path/image.jpg',
        type: 'photo' as const,
        onClose: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        console.log = originalConsoleLog;
    });

    it('renders correctly with photo type', () => {
        const { getByTestId } = renderWithSafeArea(<StoryPreview {...mockProps} />);

        // Verify the container renders
        expect(getByTestId('preview-container')).toBeTruthy();
    });

    it('calls onClose when close button is pressed', () => {
        const { getByTestId } = renderWithSafeArea(<StoryPreview {...mockProps} />);

        // Press the close button
        fireEvent.press(getByTestId('close-button'));

        // Verify onClose was called
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('shows text input modal when text button is pressed', () => {
        const { getByTestId, UNSAFE_getAllByProps } = renderWithSafeArea(<StoryPreview {...mockProps} />);

        // Find TextInputModal component by checking for isVisible prop
        const textInputModals = UNSAFE_getAllByProps({ isVisible: false });
        expect(textInputModals.length).toBeGreaterThan(0);

        // Press the add text button
        fireEvent.press(getByTestId('add-text-button'));

        // Re-render to get updated props and find modal with isVisible=true
        const visibleModals = UNSAFE_getAllByProps({ isVisible: true });
        expect(visibleModals.length).toBeGreaterThan(0);
    });

    it('adds text sticker when text is entered and saved', () => {
        // Create a spy on the addTextSticker function
        const addTextStickerMock = jest.fn().mockReturnValue('test-sticker-id');

        // Mock the useStickerStore hook to return our mock function
        jest.spyOn(require('../lib/story-editor/store'), 'useStickerStore').mockReturnValue({
            stickers: [],
            addSticker: addTextStickerMock,
            updateSticker: jest.fn(),
            updateStickerStyle: jest.fn(),
            removeSticker: jest.fn(),
            getSticker: jest.fn(),
        });

        // Get the TextInputModal mock
        const { TextInputModal } = require('../components/story/TextInput');

        // Render the component
        const { getByTestId } = renderWithSafeArea(<StoryPreview {...mockProps} />);

        // Press the add text button to open the text input modal
        fireEvent.press(getByTestId('add-text-button'));

        // Verify TextInputModal was called and extract the onSave prop
        expect(TextInputModal).toHaveBeenCalled();
        const lastCall = TextInputModal.mock.calls[TextInputModal.mock.calls.length - 1];
        const onSave = lastCall[0].onSave;

        // Call onSave with test text
        onSave('Test sticker text');

        // Check that addSticker was called
        expect(addTextStickerMock).toHaveBeenCalled();
    });

    it('renders video player when type is video', () => {
        const videoProps = {
            ...mockProps,
            type: 'video' as const,
            path: '/test/path/video.mp4',
        };

        const { getByTestId } = renderWithSafeArea(<StoryPreview {...videoProps} />);

        // Verify video player renders
        expect(getByTestId('video-player')).toBeTruthy();
    });

    it('logs preview information on mount', () => {
        renderWithSafeArea(<StoryPreview {...mockProps} />);

        // Check if console.log was called with preview information
        expect(console.log).toHaveBeenCalledWith(
            'Preview received:',
            expect.objectContaining({
                path: mockProps.path,
                type: mockProps.type,
            })
        );
    });
});
