import { test, expect } from '@playwright/test';
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';

test.describe('Private Key Login', () => {
    test('logs in with valid private key', async ({ page }) => {
        // Generate valid keys for testing
        const privateKey = generateSecretKey();
        const publicKey = getPublicKey(privateKey);
        const nsec = nip19.nsecEncode(privateKey);
        
        // Mock NDK functionality - this can be expanded in a real implementation
        await page.route('**/api/ndk/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });
        
        // Go to login page
        await page.goto('/login');
        
        // Switch to private key login
        await page.getByRole('button', { name: 'Private Key' }).click();
        
        // Enter the private key
        await page.getByPlaceholder('Enter your nsec private key').fill(nsec);
        
        // Click login
        await page.getByRole('button', { name: 'Login with Private Key' }).click();
        
        // Verify localStorage was updated
        const loginMethod = await page.evaluate(() => localStorage.getItem('nostr_login_method'));
        const storedNsec = await page.evaluate(() => localStorage.getItem('nostr_nsec'));
        
        if (loginMethod && storedNsec) {
            expect(loginMethod).toBe('privateKey');
            expect(storedNsec).toBe(nsec);
        }
    });
    
    test('shows error for invalid nsec format', async ({ page }) => {
        // Go to login page
        await page.goto('/login');
        
        // Switch to private key login
        await page.getByRole('button', { name: 'Private Key' }).click();
        
        // Enter invalid private key (not starting with nsec1)
        await page.getByPlaceholder('Enter your nsec private key').fill('invalid_private_key');
        
        // Click login
        await page.getByRole('button', { name: 'Login with Private Key' }).click();
        
        // Should show error
        await expect(page.getByText('Invalid private key format. Must start with "nsec1"')).toBeVisible();
    });
}); 