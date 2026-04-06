/**
 * Screenshots of key app states for sharing.
 * Run with: npx playwright test --config=playwright.demo.config.ts e2e/demo/screenshots.spec.ts
 * Images saved to demo-output/screenshots/
 */

import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { clearDatabase } from '../helpers/db';
import { createApplication, createDocument } from '../helpers/api';

const OUT = path.resolve('demo-output/screenshots');

test.beforeAll(() => {
	fs.mkdirSync(OUT, { recursive: true });
});

async function shot(page: import('@playwright/test').Page, name: string) {
	await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
}

test('capture key screenshots', async ({ page }) => {
	test.setTimeout(120000);
	await clearDatabase();

	// 1. Empty dashboard
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await shot(page, '01-dashboard-empty');

	// Seed applications for a realistic dashboard
	await createApplication({ name: 'Augustinus Fonden', status: 'in_progress', deadline: '2025-06-15' });
	await createApplication({ name: 'Carlsberg Fondet', status: 'submitted' });
	await createApplication({ name: 'Tuborgfondet', status: 'accepted' });
	await createApplication({ name: 'Novo Nordisk Fonden', status: 'draft' });
	await createApplication({ name: 'Ole Kirks Fond', status: 'rejected' });

	// 2. Dashboard with applications
	await page.reload();
	await page.waitForLoadState('networkidle');
	await shot(page, '02-dashboard-with-apps');

	// 3. Dashboard filtered by "Indsendt"
	await page.getByRole('button', { name: 'Indsendt' }).click();
	await page.waitForLoadState('networkidle');
	await shot(page, '03-dashboard-filtered');

	// Reset filter
	await page.getByRole('button', { name: 'Alle' }).click();

	// 4. Wizard Step 1
	await page.getByRole('link', { name: 'Opret ny ansøgning' }).first().click();
	await page.waitForLoadState('networkidle');
	await page.getByLabel('Navn på legat/stipendium').fill('Augustinus Fonden 2025');
	await page.getByLabel('Ansøgningsfrist (valgfrit)').fill('2025-09-01');
	await page.getByLabel('URL til legatopslag (valgfrit)').fill('https://www.augustinusfonden.dk/ansoeg');
	await shot(page, '04-wizard-step1');

	// 5. Wizard Step 2 (AI analysis)
	await page.getByRole('button', { name: 'Næste' }).click();
	await page.waitForLoadState('networkidle');
	await shot(page, '05-wizard-step2-ai');

	// 6. Wizard Step 3 (document selection)
	await page.getByRole('button', { name: 'Næste' }).click();
	await page.waitForLoadState('networkidle');
	await page.getByLabel('Motiveret ansøgning').check();
	await page.getByLabel('CV').check();
	await page.getByLabel('Budget').check();
	await shot(page, '06-wizard-step3-docs');

	// 7. Wizard Step 5 (review)
	await page.getByRole('button', { name: 'Næste' }).click();
	await page.getByRole('button', { name: 'Næste' }).click();
	await page.waitForLoadState('networkidle');
	await shot(page, '07-wizard-step5-review');

	// Create the application
	await page.getByRole('button', { name: 'Opret ansøgning' }).click();
	await page.waitForURL(/\/applications\/\d+/);
	await page.waitForLoadState('networkidle');

	// 8. Application detail
	await shot(page, '08-application-detail');

	// Change status
	await page.getByRole('button', { name: 'Kladde' }).click();
	await page.selectOption('select', 'in_progress');
	await page.waitForLoadState('networkidle');

	// Open a document
	await page.getByRole('link', { name: /Motiveret ansøgning/ }).first().click();
	await page.waitForLoadState('networkidle');

	// 9. Document editor (empty)
	await shot(page, '09-document-editor-empty');

	// Type some content
	const editor = page.locator('.ProseMirror');
	await editor.click();
	await editor.pressSequentially(
		'Dette projekt sigter mod at styrke dansk kulturarv gennem digital formidling og moderne teknologi.',
		{ delay: 20 }
	);
	await page.waitForTimeout(1500);

	// 10. Document editor with content
	await shot(page, '10-document-editor-with-content');

	// Navigate back
	await page.getByRole('link', { name: /Augustinus Fonden 2025/ }).click();
	await page.waitForLoadState('networkidle');

	// 11. Application detail with documents
	await shot(page, '11-application-detail-with-docs');

	// 12. Profile/templates page — save a template first
	const appDetail = await createApplication({ name: 'Skabelon Legat' });
	const templateDoc = await createDocument({
		applicationId: appDetail.id,
		title: 'Standard CV',
		type: 'rich_text',
		category: 'cv'
	});
	await page.goto(`/applications/${appDetail.id}/docs/${templateDoc.id}`);
	await page.waitForLoadState('networkidle');
	page.once('dialog', async (dialog) => dialog.accept('Standard CV'));
	await page.getByRole('button', { name: 'Gem som skabelon' }).click();
	await page.waitForTimeout(800);

	await page.goto('/profile');
	await page.waitForLoadState('networkidle');
	await shot(page, '12-profile-templates');
});
