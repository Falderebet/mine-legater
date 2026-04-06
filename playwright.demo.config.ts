import { defineConfig, devices } from '@playwright/test';

/**
 * Demo recording config.
 * Run with: npx playwright test --config=playwright.demo.config.ts
 * Video is saved to demo-output/
 */
export default defineConfig({
	testDir: './e2e/demo',
	fullyParallel: false,
	workers: 1,
	forbidOnly: false,
	retries: 0,
	reporter: [['list']],
	globalSetup: './e2e/global-setup.ts',
	globalTeardown: './e2e/global-teardown.ts',
	timeout: 180000,
	use: {
		baseURL: 'http://localhost:5173',
		video: 'on',
		viewport: { width: 1280, height: 800 },
		launchOptions: {
			slowMo: 80,
		},
	},
	outputDir: 'demo-output',
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: false,
		env: {
			DATABASE_URL: 'file:test.db',
		},
	},
});
