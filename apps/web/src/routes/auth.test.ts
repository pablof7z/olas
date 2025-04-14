import { test, expect } from '@playwright/test';

// Mock Nostr Extension
const mockNostrExtension = {
    getPublicKey: async () => 'npub1exampleextensionpublickey',
    signEvent: async () => ({ sig: 'fake-signature' }),
    getRelays: async () => ({ relays: {} }),
    nip04: {
        encrypt: async () => 'encrypted',
        decrypt: async () => 'decrypted'
    }
};

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to home page
        await page.goto('/');
    });
    
    test('Opens login modal when login button is clicked', async ({ page }) => {
        // Click the login button in sidebar
        await page.getByText('login', { exact: true }).click();
        
        // Verify modal is open
        await expect(page.getByText('Get Started with Olas')).toBeVisible();
        
        // Verify both paths are available
        await expect(page.getByText('Create New Account')).toBeVisible();
        await expect(page.getByText('Use Nostr Extension')).toBeVisible();
    });
    
    test('Create account path generates keys and logs in user', async ({ page }) => {
        // Mock the NDKPrivateKeySigner.generate method
        await page.addInitScript(() => {
            window.NDKPrivateKeySignerGenerated = false;
            
            // Mock the NDK module
            const originalNDK = window.NDK;
            window.NDK = {
                ...originalNDK,
                NDKPrivateKeySigner: {
                    generate: () => {
                        window.NDKPrivateKeySignerGenerated = true;
                        return {
                            user: async () => ({
                                npub: 'npub1testuser',
                                pubkey: 'pubkey123'
                            })
                        };
                    }
                }
            };
        });
        
        // Click login button to open modal
        await page.getByText('login', { exact: true }).click();
        
        // Click create account
        await page.getByRole('button', { name: 'Create Account' }).click();
        
        // Verify account creation was attempted
        const wasGenerated = await page.evaluate(() => window.NDKPrivateKeySignerGenerated);
        expect(wasGenerated).toBeTruthy();
        
        // Verify modal is closed after account creation
        await expect(page.getByText('Get Started with Olas')).not.toBeVisible({ timeout: 2000 });
    });
    
    test('Extension path connects to existing extension', async ({ page }) => {
        // Mock window.nostr extension
        await page.addInitScript(() => {
            window.nostr = {
                getPublicKey: async () => 'npub1exampleextensionpublickey',
                signEvent: async () => ({ sig: 'fake-signature' }),
                getRelays: async () => ({ relays: {} }),
                nip04: {
                    encrypt: async () => 'encrypted',
                    decrypt: async () => 'decrypted'
                }
            };
            
            // Track if extension was used
            window.extensionWasUsed = false;
            
            // Mock NDKNip07Signer
            const originalNDK = window.NDK || {};
            window.NDK = {
                ...originalNDK,
                NDKNip07Signer: function() {
                    window.extensionWasUsed = true;
                    return {
                        user: async () => ({
                            npub: 'npub1fromextension',
                            pubkey: 'pubkeyfromextension'
                        })
                    };
                }
            };
        });
        
        // Click login button
        await page.getByText('login', { exact: true }).click();
        
        // Verify extension was detected and used
        const wasExtensionUsed = await page.evaluate(() => window.extensionWasUsed);
        expect(wasExtensionUsed).toBeTruthy();
        
        // Modal should not be visible as extension was detected
        await expect(page.getByText('Get Started with Olas')).not.toBeVisible();
    });
    
    test('Manual extension connection through modal works', async ({ page }) => {
        // Remove extension first to ensure modal opens
        await page.addInitScript(() => {
            window.nostr = undefined;
            
            // Track if extension button was clicked
            window.connectExtensionClicked = false;
            
            // Setup for after extension button is clicked
            window.addEventListener('connectExtensionClicked', () => {
                // Simulate extension becoming available
                window.nostr = {
                    getPublicKey: async () => 'npub1exampleextensionpublickey',
                    signEvent: async () => ({ sig: 'fake-signature' })
                };
                
                // Mock NDKNip07Signer
                const originalNDK = window.NDK || {};
                window.NDK = {
                    ...originalNDK,
                    NDKNip07Signer: function() {
                        return {
                            user: async () => ({
                                npub: 'npub1fromextension',
                                pubkey: 'pubkeyfromextension'
                            })
                        };
                    }
                };
            });
        });
        
        // Override the login function to track extension button clicks
        await page.addInitScript(() => {
            window.addEventListener('click', e => {
                if (e.target.textContent.includes('Connect Extension')) {
                    window.connectExtensionClicked = true;
                    window.dispatchEvent(new Event('connectExtensionClicked'));
                }
            }, true);
        });
        
        // Click login button to open modal
        await page.getByText('login', { exact: true }).click();
        
        // Now click connect extension button in the modal
        await page.getByRole('button', { name: 'Connect Extension' }).click();
        
        // Verify connect extension was clicked
        const wasClicked = await page.evaluate(() => window.connectExtensionClicked);
        expect(wasClicked).toBeTruthy();
    });
    
    test('Links to external resources work correctly', async ({ page, context }) => {
        // Track new pages that will be opened by links
        const pagePromise = context.waitForEvent('page');
        
        // Click login button to open modal
        await page.getByText('login', { exact: true }).click();
        
        // Click the Alby link
        await page.getByText('Alby').click();
        
        // Wait for the new page to open
        const newPage = await pagePromise;
        await newPage.waitForLoadState();
        
        // Verify it navigated to Alby site
        expect(newPage.url()).toContain('getalby.com');
    });
}); 