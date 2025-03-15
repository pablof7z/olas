import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
    test('page loads correctly', async ({ page }) => {
        // Navigate to the root path since the login may be the default route
        await page.goto('/');
        
        // Add a pause for debugging if needed
        // await page.pause();
        
        // Take a screenshot to see what's being rendered
        await page.screenshot({ path: 'screenshot.png' });
        
        // Add a longer timeout to accommodate app startup
        // Check page title is displayed
        const title = page.locator('h1:has-text("Nostr Wallet")');
        await expect(title).toBeVisible({ timeout: 15000 });
        
        // Check login tabs are present
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
        
        // Check login method toggle is present - using more specific selectors
        await expect(page.locator('button.px-4.py-2', { hasText: 'Browser Extension' })).toBeVisible();
        await expect(page.locator('button.px-4.py-2', { hasText: 'Private Key' })).toBeVisible();
        
        // Test tab switching works
        await page.getByRole('button', { name: 'Create Account' }).click();
        await expect(page.locator('input#name')).toBeVisible();
        
        // Switch back to login
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.getByRole('button', { name: 'Connect with Extension' })).toBeVisible();
        
        // Test login method toggle works - using more specific selectors
        await page.locator('button.px-4.py-2', { hasText: 'Private Key' }).click();
        const privateKeyInput = page.locator('input[placeholder="Enter your nsec private key"]');
        await expect(privateKeyInput).toBeVisible();
    });
}); 