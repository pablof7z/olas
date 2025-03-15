import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    testMatch: ['**/*.@(spec|test).?(m)[jt]s?(x)', '**/*.(spec|test).?(m)[jt]s?(x)', '**/*.?(c)js'],
    timeout: 60000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { open: 'never' }]],
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on',
        screenshot: 'on',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'pnpm dev',
        port: 5173,
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
    },
}); 