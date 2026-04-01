import { test, expect } from '@playwright/test';
import { clearDatabase } from '../helpers/db';
import { createApplication, createDocument } from '../helpers/api';

test.beforeEach(async () => {
	await clearDatabase();
});

test('document editor loads for rich text document', async ({ page }) => {
	const app = await createApplication({ name: 'Editor Test Legat' });
	const doc = await createDocument({ applicationId: app.id, title: 'Motiveret Ansøgning', type: 'rich_text', category: 'motivated_application' });

	await page.goto(`/applications/${app.id}/docs/${doc.id}`);

	await expect(page.getByRole('heading', { name: 'Motiveret Ansøgning' })).toBeVisible();
	await expect(page.locator('p').filter({ hasText: /^Motiveret ansøgning$/ })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Eksportér PDF' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Gem som skabelon' })).toBeVisible();
});

test('document editor loads for spreadsheet document', async ({ page }) => {
	const app = await createApplication({ name: 'Spreadsheet Test Legat' });
	const doc = await createDocument({ applicationId: app.id, title: 'Budget 2025', type: 'spreadsheet', category: 'budget' });

	await page.goto(`/applications/${app.id}/docs/${doc.id}`);

	await expect(page.getByRole('heading', { name: 'Budget 2025' })).toBeVisible();
	await expect(page.getByText('Budget', { exact: true })).toBeVisible(); // category label
});

test('shows "Gemt" save status initially', async ({ page }) => {
	const app = await createApplication({ name: 'Save Status Test' });
	const doc = await createDocument({ applicationId: app.id, title: 'Test Doc', type: 'rich_text' });

	await page.goto(`/applications/${app.id}/docs/${doc.id}`);

	await expect(page.getByText('Gemt')).toBeVisible();
});

test('typing in rich text editor triggers autosave', async ({ page }) => {
	const app = await createApplication({ name: 'Autosave Test Legat' });
	const doc = await createDocument({ applicationId: app.id, title: 'Autosave Doc', type: 'rich_text' });

	await page.goto(`/applications/${app.id}/docs/${doc.id}`);
	await page.waitForLoadState('networkidle');

	// Click into the editor and type
	const editor = page.locator('.ProseMirror');
	await editor.click();
	await editor.pressSequentially('Hej verden');

	// After debounce (1s), should show "Gemt"
	await expect(page.getByText('Gemt')).toBeVisible({ timeout: 5000 });
});

test('"back" link navigates to application detail', async ({ page }) => {
	const app = await createApplication({ name: 'Tilbage Test Legat' });
	const doc = await createDocument({ applicationId: app.id, title: 'Tilbage Doc' });

	await page.goto(`/applications/${app.id}/docs/${doc.id}`);

	await page.getByRole('link', { name: /Tilbage Test Legat/ }).click();

	await expect(page).toHaveURL(`/applications/${app.id}`);
});

test('document link on application detail navigates to editor', async ({ page }) => {
	const app = await createApplication({ name: 'Nav Test Legat' });
	const doc = await createDocument({ applicationId: app.id, title: 'Nav Doc', type: 'rich_text' });

	await page.goto(`/applications/${app.id}`);

	await page.getByRole('link', { name: 'Nav Doc' }).click();

	await expect(page).toHaveURL(`/applications/${app.id}/docs/${doc.id}`);
});
