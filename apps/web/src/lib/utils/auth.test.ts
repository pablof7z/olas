import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';

// First, let's extract the createAccount function to a separate utility file for better testing
import { createAccount } from '$lib/utils/auth';
import ndk from '$lib/stores/ndk.svelte';
import { setCurrentUser } from '$lib/stores/currentUser.svelte';

// Mock the dependencies
vi.mock('@nostr-dev-kit/ndk', () => ({
    NDKPrivateKeySigner: {
        generate: vi.fn().mockImplementation(() => ({
            user: vi.fn().mockResolvedValue({
                npub: 'npub1test',
                pubkey: 'pubkeytest'
            })
        }))
    }
}));

vi.mock('$lib/stores/ndk.svelte', () => ({
    default: {
        signer: null
    }
}));

vi.mock('$lib/stores/currentUser.svelte', () => ({
    setCurrentUser: vi.fn()
}));

describe('Auth Utils', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('createAccount', () => {
        it('generates new keys with NDKPrivateKeySigner', async () => {
            await createAccount();
            
            expect(NDKPrivateKeySigner.generate).toHaveBeenCalled();
        });

        it('sets the generated signer on the NDK instance', async () => {
            const mockSigner = {
                user: vi.fn().mockResolvedValue({
                    npub: 'npub1test',
                    pubkey: 'pubkeytest'
                })
            };
            
            vi.mocked(NDKPrivateKeySigner.generate).mockReturnValueOnce(mockSigner);
            
            await createAccount();
            
            expect(ndk.signer).toBe(mockSigner);
        });

        it('calls setCurrentUser with the new user', async () => {
            const mockUser = {
                npub: 'npub1test',
                pubkey: 'pubkeytest'
            };
            
            const mockSigner = {
                user: vi.fn().mockResolvedValue(mockUser)
            };
            
            vi.mocked(NDKPrivateKeySigner.generate).mockReturnValueOnce(mockSigner);
            
            await createAccount();
            
            expect(mockSigner.user).toHaveBeenCalled();
            expect(setCurrentUser).toHaveBeenCalledWith(mockUser);
        });

        it('returns the generated user', async () => {
            const mockUser = {
                npub: 'npub1test',
                pubkey: 'pubkeytest'
            };
            
            const mockSigner = {
                user: vi.fn().mockResolvedValue(mockUser)
            };
            
            vi.mocked(NDKPrivateKeySigner.generate).mockReturnValueOnce(mockSigner);
            
            const result = await createAccount();
            
            expect(result).toEqual(mockUser);
        });

        it('handles errors during key generation', async () => {
            const error = new Error('Failed to generate keys');
            vi.mocked(NDKPrivateKeySigner.generate).mockImplementationOnce(() => {
                throw error;
            });
            
            // Mock console.error to prevent test output noise
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const result = await createAccount();
            
            expect(consoleSpy).toHaveBeenCalledWith('Error creating account:', error);
            expect(result).toBeNull();
            
            consoleSpy.mockRestore();
        });

        it('returns null when errors occur', async () => {
            vi.mocked(NDKPrivateKeySigner.generate).mockImplementationOnce(() => {
                throw new Error('Failed to generate keys');
            });
            
            // Silence console.error
            vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const result = await createAccount();
            
            expect(result).toBeNull();
        });
    });
}); 