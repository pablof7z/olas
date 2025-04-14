import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import Sidebar from './Sidebar.svelte';
import { NDKPrivateKeySigner, NDKNip07Signer } from '@nostr-dev-kit/ndk';
import ndk from '$lib/stores/ndk.svelte';
import { getCurrentUser, setCurrentUser } from '$lib/stores/currentUser.svelte';

// Mock the NDK modules
vi.mock('@nostr-dev-kit/ndk', async () => {
    const actual = await vi.importActual('@nostr-dev-kit/ndk');
    return {
        ...actual,
        NDKPrivateKeySigner: {
            generate: vi.fn().mockImplementation(() => ({
                user: vi.fn().mockResolvedValue({
                    npub: 'npub1test',
                    pubkey: 'pubkeytest'
                })
            }))
        },
        NDKNip07Signer: vi.fn().mockImplementation(() => ({
            user: vi.fn().mockResolvedValue({
                npub: 'npub1extension',
                pubkey: 'pubkeyextension' 
            })
        }))
    };
});

// Mock the NDK and user stores
vi.mock('$lib/stores/ndk.svelte', () => ({
    default: {
        signer: null,
        cacheAdapter: {
            fetchProfileSync: vi.fn().mockImplementation(() => ({
                name: 'Test User',
                nip05: 'test@example.com'
            }))
        }
    }
}));

vi.mock('$lib/stores/currentUser.svelte', () => ({
    getCurrentUser: vi.fn().mockImplementation(() => null),
    setCurrentUser: vi.fn()
}));

// Mock app state
vi.mock('$app/state', () => ({
    page: {
        url: {
            pathname: '/'
        }
    }
}));

// Mock mode-watcher
vi.mock('mode-watcher', () => ({
    mode: 'light',
    toggleMode: vi.fn()
}));

describe('Sidebar Component', () => {
    // Reset mocks and cleanup after each test
    afterEach(() => {
        vi.clearAllMocks();
        cleanup();
    });

    beforeEach(() => {
        // Mock window.nostr for extension tests
        global.window = Object.create(window);
        Object.defineProperty(window, 'nostr', {
            value: undefined,
            writable: true
        });
    });

    it('renders the sidebar with login button when user is not logged in', () => {
        render(Sidebar);
        expect(screen.getByText('login')).toBeDefined();
    });

    it('opens the login modal when login is clicked and no extension is available', async () => {
        const { component } = render(Sidebar);
        
        // Click the login button
        const loginButton = screen.getByText('login');
        await fireEvent.click(loginButton);
        
        // Check if modal is opened
        expect(component.$$.ctx[component.$$.props.openLoginModal]).toBe(true);
        expect(screen.getByText('Get Started with Olas')).toBeDefined();
    });

    describe('Create Account Path', () => {
        it('generates new keys when Create Account is clicked', async () => {
            const { component } = render(Sidebar);
            
            // Open modal manually
            await component.$set({ openLoginModal: true });
            
            // Find and click the Create Account button
            const createAccountButton = screen.getByText('Create Account');
            await fireEvent.click(createAccountButton);
            
            // Verify key generation was called
            expect(NDKPrivateKeySigner.generate).toHaveBeenCalled();
            
            // Verify user is set
            expect(setCurrentUser).toHaveBeenCalledWith({
                npub: 'npub1test',
                pubkey: 'pubkeytest'
            });
            
            // Verify modal is closed
            expect(component.$$.ctx[component.$$.props.openLoginModal]).toBe(false);
        });

        it('handles errors during account creation', async () => {
            // Mock the generate function to throw an error
            vi.mocked(NDKPrivateKeySigner.generate).mockImplementationOnce(() => {
                throw new Error('Failed to generate keys');
            });
            
            // Spy on console.error
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const { component } = render(Sidebar);
            
            // Open modal manually
            await component.$set({ openLoginModal: true });
            
            // Find and click the Create Account button
            const createAccountButton = screen.getByText('Create Account');
            await fireEvent.click(createAccountButton);
            
            // Verify error handling
            expect(consoleSpy).toHaveBeenCalledWith('Error creating account:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('Extension Login Path', () => {
        it('uses extension if available without showing modal', async () => {
            // Mock window.nostr to be defined
            window.nostr = {};
            
            render(Sidebar);
            
            // Click login button
            const loginButton = screen.getByText('login');
            await fireEvent.click(loginButton);
            
            // Verify NDKNip07Signer was used
            expect(NDKNip07Signer).toHaveBeenCalled();
            expect(ndk.signer).toBeDefined();
            
            // Verify user is set from extension
            expect(setCurrentUser).toHaveBeenCalledWith({
                npub: 'npub1extension',
                pubkey: 'pubkeyextension'
            });
        });

        it('connects extension when Connect Extension button is clicked', async () => {
            // Mock window.nostr to be defined
            window.nostr = {};
            
            const { component } = render(Sidebar);
            
            // Open modal manually
            await component.$set({ openLoginModal: true });
            
            // Find and click Connect Extension button
            const connectButton = screen.getByText('Connect Extension');
            await fireEvent.click(connectButton);
            
            // Verify NDKNip07Signer was used
            expect(NDKNip07Signer).toHaveBeenCalled();
            expect(ndk.signer).toBeDefined();
            
            // Verify user is set from extension
            expect(setCurrentUser).toHaveBeenCalledWith({
                npub: 'npub1extension',
                pubkey: 'pubkeyextension'
            });
        });
    });

    describe('Logged In State', () => {
        it('shows profile link when user is logged in', () => {
            // Mock getCurrentUser to return a user
            vi.mocked(getCurrentUser).mockReturnValue({
                user: {
                    npub: 'npub1test',
                    pubkey: 'pubkeytest'
                }
            });
            
            render(Sidebar);
            
            // Should show profile link instead of login
            expect(screen.queryByText('login')).toBeNull();
            expect(screen.getByText('Test User')).toBeDefined();
        });
    });
}); 