// @ts-nocheck
import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
    await page.goto('/');
    
    // Take a screenshot
    await page.screenshot({ path: 'homepage.png' });
    
    // Very simple check
    expect(await page.title()).toBeTruthy();
}); 