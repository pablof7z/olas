import { test, expect } from '@playwright/test';

test('homepage redirects to login', async ({ page }) => {
    // Navigate to the root path
    await page.goto('/');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'homepage.png' });
    
    // Check that we are redirected to the login page
    await expect(page).toHaveURL(/.*\/login$/);
    
    // Title check
    const title = await page.title();
    console.log('Page title:', title);
    
    // Look for the Nostr Wallet title on the page
    const walletTitle = page.locator('h1:has-text("Nostr Wallet")');
    await expect(walletTitle).toBeVisible({ timeout: 5000 });
}); 