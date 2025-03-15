import { test, expect } from '@playwright/test';
import path from 'path';

// Extend Window interface to allow our mocks
declare global {
    interface Window {
        _ndk_mock?: {
            publish: () => Promise<boolean>;
            user: {
                pubkey: string;
            };
        };
        NDKEvent?: any;
    }
}

// Setup: Mock authentication and NDK
test.beforeEach(async ({ page }) => {
    // Mock localStorage to simulate logged-in user
    await page.addInitScript(() => {
        // Create a mock pubkey
        const mockPubkey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        
        // Mock localStorage with auth data
        window.localStorage.setItem('nostr_pubkey', mockPubkey);
        window.localStorage.setItem('nostr_login_method', 'privateKey');
        
        // Mock NDK functionality
        window._ndk_mock = {
            publish: async () => true,
            user: {
                pubkey: mockPubkey
            }
        };
    });
});

test('PostEditor should open file dialog and display selected images', async ({ page }) => {
    // Go to a page where the sidebar/PostEditor is accessible
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForSelector('button:has-text("Create")');
    
    // Click the Create button to open the dialog
    await page.click('button:has-text("Create")');
    
    // Check that the dialog opened
    await expect(page.locator('h3:has-text("Create new post")')).toBeVisible();
    
    // Prepare the file input (it's hidden in the DOM)
    const fileInput = page.locator('input[type="file"]');
    
    // Find absolute path to test image
    const imagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    
    // Mock the file dialog by directly setting the files on the input
    await fileInput.setInputFiles(imagePath);
    
    // Check that the file was added (thumbnail should be visible)
    await expect(page.locator('.grid-cols-2 img')).toBeVisible({ timeout: 5000 });
    
    // Enter a caption
    await page.locator('textarea[placeholder="Write a caption..."]').fill('Test post from Playwright');
    
    // Mock the upload and NDK event creation
    await page.route('**/upload', async (route) => {
        // Mock a successful upload response
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                url: 'https://example.com/image.jpg',
                sha256: 'abcdef1234567890',
                type: 'image/jpeg',
                size: 12345,
                uploaded: Date.now() / 1000
            })
        });
    });
    
    // Mock NDK event creation
    await page.evaluate(() => {
        window.NDKEvent = class {
            kind = 1;
            tags = [];
            content = '';
            publish = async () => true;
        };
    });
    
    // Click the Post button
    await page.locator('button:has-text("Post")').click();
    
    // Verify the dialog closes after posting
    await expect(page.locator('h3:has-text("Create new post")')).not.toBeVisible({ timeout: 5000 });
});

test('PostEditor should show proper error messages', async ({ page }) => {
    // Go to the main page
    await page.goto('/');
    
    // Open the dialog
    await page.click('button:has-text("Create")');
    
    // Try to post without content or image
    await page.locator('button:has-text("Post")').click();
    
    // Check error message
    await expect(page.locator('text=Please add an image or write a caption')).toBeVisible();
});

test('PostEditor should handle remove file functionality', async ({ page }) => {
    // Go to the main page
    await page.goto('/');
    
    // Open the dialog
    await page.click('button:has-text("Create")');
    
    // Add a file
    const fileInput = page.locator('input[type="file"]');
    const imagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    await fileInput.setInputFiles(imagePath);
    
    // Wait for thumbnail to appear
    await expect(page.locator('.grid-cols-2 img')).toBeVisible({ timeout: 5000 });
    
    // Hover over the image to make the remove button visible
    await page.locator('.grid-cols-2 img').hover();
    
    // Click the remove button
    await page.locator('button:has([data-lucide="x"])').click();
    
    // Verify the upload area returns to its initial state
    await expect(page.locator('text=Drag photos here')).toBeVisible({ timeout: 5000 });
}); 