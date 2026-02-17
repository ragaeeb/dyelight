import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    expect: {
        timeout: 5000,
    },
    fullyParallel: false,
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],
    reporter: [['list'], ['html', { open: 'never' }]],
    retries: process.env.CI ? 2 : 0,
    testDir: './e2e/tests',
    testMatch: '**/*.pw.ts',
    timeout: 30_000,
    use: {
        baseURL: 'http://127.0.0.1:4173',
        headless: true,
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'bunx vite --config e2e/vite.config.ts --host 127.0.0.1 --port 4173 --strictPort',
        reuseExistingServer: !process.env.CI,
        url: 'http://127.0.0.1:4173/e2e/harness/index.html',
    },
});
