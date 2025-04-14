import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAccount, connectExtension } from './auth';
import { NDKPrivateKeySigner, NDKNip07Signer } from '@nostr-dev-kit/ndk';
import ndk from '$lib/stores/ndk.svelte';
import { setCurrentUser, getCurrentUser } from '$lib/stores/currentUser.svelte';

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
        signer: null
    }
}));

vi.mock('$lib/stores/currentUser.svelte', () => ({
    getCurrentUser: vi.fn().mockImplementation(() => null),
    setCurrentUser: vi.fn()
}));

describe('Auth Utilities Integration Tests', () => {
    // Reset global window mocks before each test
    beforeEach(() => {
        // Mock window.nostr for extension tests
        global.window = Object.create(window);
        Object.defineProperty(window, 'nostr', {
            value: undefined,
            writable: true
        });
    });
    
    // Clear mocks after each test
    afterEach(() => {
        vi.clearAllMocks();
    });
    
    describe('createAccount', () => {
        it('creates an account with NDKPrivateKeySigner', async () => {
            const user = await createAccount();
            
            expect(NDKPrivateKeySigner.generate).toHaveBeenCalled();
            expect(setCurrentUser).toHaveBeenCalledWith({
                npub: 'npub1test',
                pubkey: 'pubkeytest'
            });
            expect(user).toEqual({
                npub: 'npub1test',
                pubkey: 'pubkeytest'
            });
        });
        
        it('handles errors and returns null', async () => {
            // Make generate throw an error
            vi.mocked(NDKPrivateKeySigner.generate).mockImplementationOnce(() => {
                throw new Error('Failed to generate keys');
            });
            
            // Silence console.error
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const result = await createAccount();
            
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Error creating account:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });
    
    describe('connectExtension', () => {
        it('returns false when no extension is available', async () => {
            // Ensure window.nostr is undefined
            window.nostr = undefined;
            
            const result = await connectExtension();
            
            expect(result).toBe(false);
            expect(NDKNip07Signer).not.toHaveBeenCalled();
        });
        
        it('connects to available extension', async () => {
            // Mock window.nostr to be defined
            window.nostr = {};
            
            const result = await connectExtension();
            
            expect(result).toBe(true);
            expect(NDKNip07Signer).toHaveBeenCalled();
            expect(setCurrentUser).toHaveBeenCalledWith({
                npub: 'npub1extension',
                pubkey: 'pubkeyextension'
            });
        });
        
        it('handles error from extension', async () => {
            // Mock window.nostr to be defined
            window.nostr = {};
            
            // Make NDKNip07Signer.user throw an error
            vi.mocked(NDKNip07Signer).mockImplementationOnce(() => ({
                user: vi.fn().mockRejectedValue(new Error('Extension error'))
            }));
            
            // Silence console.error
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const result = await connectExtension();
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('Error connecting to extension:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
        
        it('returns false when user is not returned from extension', async () => {
            // Mock window.nostr to be defined
            window.nostr = {};
            
            // Make NDKNip07Signer.user return null
            vi.mocked(NDKNip07Signer).mockImplementationOnce(() => ({
                user: vi.fn().mockResolvedValue(null)
            }));
            
            const result = await connectExtension();
            
            expect(result).toBe(false);
            expect(setCurrentUser).not.toHaveBeenCalled();
        });
    });
}); 