import { test, expect } from '@playwright/test';
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';

test.describe('Authentication', () => {
    test('login page displays correctly with extension and private key options', async ({ page }) => {
        await page.goto('/login');
        
        // Wait for the page to load completely
        await page.waitForSelector('[role="tablist"]');
        
        // The Login tab should be active by default
        const loginTab = page.getByRole('tab', { name: 'Login' });
        await expect(loginTab).toBeVisible();
        await expect(loginTab).toHaveAttribute('aria-selected', 'true');
        
        // The Create Account tab should be visible but not selected
        const createTab = page.getByRole('tab', { name: 'Create Account' });
        await expect(createTab).toBeVisible();
        
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
        
        // Look for eye/eye-off icons since the button text may not be explicitly "Show"/"Hide"
        const toggleButton = page.locator('button').filter({ has: page.locator('[data-lucide]') });
        await toggleButton.click();
        await expect(privateKeyInput).toHaveAttribute('type', 'text');
        
        await toggleButton.click();
        await expect(privateKeyInput).toHaveAttribute('type', 'password');
    });
    
    test('create account tab works correctly', async ({ page }) => {
        await page.goto('/login');
        
        // Wait for the page to load completely
        await page.waitForSelector('[role="tablist"]');
        
        // Switch to Create Account tab
        const createTab = page.getByRole('tab', { name: 'Create Account' });
        await createTab.click();
        
        // Check that we're on the create account tab
        await expect(createTab).toHaveAttribute('aria-selected', 'true');
        
        // Check if a button to create an account is visible
        // Using a more flexible locator that looks for any button related to account creation
        const createButton = page.getByRole('button').getByText(/Generate New Account/i);
        await expect(createButton).toBeVisible();
    });
    
    test('login with invalid private key shows error', async ({ page }) => {
        await page.goto('/login');
        
        // Wait for the page to load completely
        await page.waitForSelector('[role="tablist"]');
        
        // Switch to private key login
        await page.getByRole('button', { name: 'Private Key' }).click();
        
        // Enter an invalid private key
        await page.getByPlaceholder('Enter your nsec private key').fill('invalid-key');
        
        // Click login button
        await page.getByRole('button').filter({ has: page.getByText(/Login with Private Key/i) }).click();
        
        // Check error message
        await expect(page.getByText(/Invalid private key format/i)).toBeVisible();
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
        
        // Wait for the page to load completely
        await page.waitForSelector('[role="tablist"]');
        
        // Switch to create account tab
        const createTab = page.getByRole('tab', { name: 'Create Account' });
        await createTab.click();
        
        // Find and click the button to create an account
        const createButton = page.getByRole('button').getByText(/Generate New Account/i);
        await createButton.click();
        
        // This would normally show the account details, but we need to mock
        // the API calls first in a more complex test
    });
}); 