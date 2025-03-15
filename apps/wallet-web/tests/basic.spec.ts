import { test, expect } from '@playwright/test';

test('basic page load test', async ({ page }) => {
    // Navigate to the root path
    await page.goto('/');
    
    // Take a screenshot to see what's rendered
    await page.screenshot({ path: 'basic-screenshot.png' });
    
    // Print out the page title
    console.log('Page title:', await page.title());
    
    // Get the HTML content for debugging
    const html = await page.content();
    console.log('Page content sample:', html.substring(0, 500) + '...');
    
    // Basic assertion to check the page loaded something
    await expect(page).toHaveURL(/.*\/$/);
}); 