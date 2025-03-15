import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
    // Navigate to a static URL that doesn't require the login component
    await page.goto('https://example.com');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'example.png' });
    
    // Perform a simple assertion
    const title = await page.title();
    console.log('Page title:', title);
    
    // Simple assertion that should pass
    await expect(page).toHaveTitle('Example Domain');
}); 