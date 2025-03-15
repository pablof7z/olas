import { test, expect } from '@playwright/test';
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';

test.describe('Authentication', () => {
    test('login page displays correctly with extension and private key options', async ({ page }) => {
        await page.goto('/login');
        
        // Check that the page loads with the login tab active
        await expect(page.getByRole('tab', { name: 'Login' })).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByRole('tab', { name: 'Create Account' })).toBeVisible();
        
        // Check login method toggle buttons are visible
        await expect(page.getByRole('button', { name: 'Browser Extension' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Private Key' })).toBeVisible();
        
        // Check that the browser extension option is selected by default
        const extensionButton = page.getByRole('button', { name: 'Browser Extension' });
        await expect(extensionButton).toHaveClass(/bg-\w+/);
        
        // Switch to private key login
        await page.getByRole('button', { name: 'Private Key' }).click();
        
        // Check that the private key input is visible
        await expect(page.getByPlaceholder('Enter your nsec private key')).toBeVisible();
        
        // Check that the show/hide button works
        const privateKeyInput = page.getByPlaceholder('Enter your nsec private key');
        await expect(privateKeyInput).toHaveAttribute('type', 'password');
        
        await page.getByRole('button', { name: 'Show' }).click();
        await expect(privateKeyInput).toHaveAttribute('type', 'text');
        
        await page.getByRole('button', { name: 'Hide' }).click();
        await expect(privateKeyInput).toHaveAttribute('type', 'password');
    });
    
    test('create account tab works correctly', async ({ page }) => {
        await page.goto('/login');
        
        // Switch to Create Account tab
        await page.getByRole('tab', { name: 'Create Account' }).click();
        
        // Check that we're on the create account tab
        await expect(page.getByRole('tab', { name: 'Create Account' })).toHaveAttribute('aria-selected', 'true');
        
        // Check generate account button is visible
        await expect(page.getByRole('button', { name: 'Generate New Account' })).toBeVisible();
    });
    
    test('login with invalid private key shows error', async ({ page }) => {
        await page.goto('/login');
        
        // Switch to private key login
        await page.getByRole('button', { name: 'Private Key' }).click();
        
        // Enter an invalid private key
        await page.getByPlaceholder('Enter your nsec private key').fill('invalid-key');
        
        // Click login button
        await page.getByRole('button', { name: 'Login with Private Key' }).click();
        
        // Check error message
        await expect(page.getByText('Invalid private key format. Must start with "nsec1"')).toBeVisible();
    });
    
    test('account creation flow mocked', async ({ page }) => {
        // Mock the implementation of the createNewAccount function
        await page.route('**/login', async (route) => {
            const url = route.request().url();
            if (route.request().method() === 'GET') {
                await route.continue();
                return;
            }
            
            // Generate mock keys for testing
            const privateKey = generateSecretKey();
            const publicKey = getPublicKey(privateKey);
            const nsec = nip19.nsecEncode(privateKey);
            const npub = nip19.npubEncode(publicKey);
            
            // Mock the window.localStorage
            await page.evaluate((data) => {
                window.localStorage.setItem('nostr_nsec', data.nsec);
                window.localStorage.setItem('nostr_login_method', 'privateKey');
            }, { nsec, npub });
            
            await route.continue();
        });
        
        await page.goto('/login');
        
        // Switch to create account tab
        await page.getByRole('tab', { name: 'Create Account' }).click();
        
        // Click generate account button
        await page.getByRole('button', { name: 'Generate New Account' }).click();
        
        // This would normally show the account details, but we need to mock
        // the API calls first in a more complex test
    });
}); 