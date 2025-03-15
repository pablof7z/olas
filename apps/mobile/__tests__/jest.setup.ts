// Mock Expo Video module
jest.mock('expo-video', () => {
    const mockPlayer = {
        replace: jest.fn(),
        play: jest.fn(),
        loop: false
    };
    
    return {
        VideoView: 'MockVideoView',
        useVideoPlayer: jest.fn().mockReturnValue(mockPlayer),
        VideoPlayer: {
            prototype: {
                constructor: jest.fn()
            }
        }
    };
});

// Mock Skia
jest.mock('@shopify/react-native-skia', () => {
    return {
        Canvas: 'MockCanvas',
        Image: 'MockSkiaImage',
        useImage: jest.fn(),
        Fill: 'MockFill',
        Group: 'MockGroup',
        RoundedRect: 'MockRoundedRect',
        Text: 'MockSkiaText',
        Skia: {
            Matrix: jest.fn(),
            Font: jest.fn().mockImplementation((fontFamily, size) => ({ 
                getSize: jest.fn().mockReturnValue(size),
                getTextWidth: jest.fn().mockImplementation((text) => text.length * size * 0.6)
            }))
        },
        useCanvasRef: jest.fn(() => ({ current: { makeImageSnapshot: jest.fn(() => ({ encodeToBase64: jest.fn() })) } })),
        FontStyle: { Normal: 'normal' },
        FontWeight: { Regular: 'regular' },
        // Add this to fix the JSI bindings error
        __internalInstanceForTesting: {
            install: jest.fn()
        }
    };
});

// Mock expo-font
jest.mock('expo-font', () => {
    return {
        isLoaded: jest.fn(() => true),
        loadAsync: jest.fn(),
        __internal__: {
            NativeFont: {
                loadAsync: jest.fn(),
            },
        },
        Font: {
            isLoaded: jest.fn(() => true),
            loadAsync: jest.fn(),
        },
    };
});

// Mock Ionicons separately to avoid referencing out-of-scope variables
const mockReact = jest.requireActual('react');
const mockReactNative = jest.requireActual('react-native');

// Create the mock before using jest.mock
const mockIonicons = function(props: { testID?: string; [key: string]: any }) {
    return mockReact.createElement(mockReactNative.View, { testID: props.testID || 'icon' });
};

jest.mock('@expo/vector-icons', () => {
    return {
        Ionicons: mockIonicons,
        createIconSet: () => function() { return null; },
    };
}); 