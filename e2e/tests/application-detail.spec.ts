import { test, expect } from '@playwright/test';
import { clearDatabase } from '../helpers/db';
import { createApplication, createDocument } from '../helpers/api';

test.beforeEach(async () => {
	await clearDatabase();
});

test('shows application name and status badge', async ({ page }) => {
	const app = await createApplication({ name: 'Status Test Legat', status: 'draft' });

	await page.goto(`/applications/${app.id}`);

	await expect(page.getByRole('heading', { name: 'Status Test Legat' })).toBeVisible();
	await expect(page.getByText('Kladde')).toBeVisible();
});

test('shows empty document state when no docs', async ({ page }) => {
	const app = await createApplication({ name: 'Ingen Docs Legat' });

	await page.goto(`/applications/${app.id}`);

	await expect(page.getByText('Ingen dokumenter endnu')).toBeVisible();
});

test('shows document list when documents exist', async ({ page }) => {
	const app = await createApplication({ name: 'Docs Legat' });
	await createDocument({ applicationId: app.id, title: 'Mit CV', category: 'cv' });
	await createDocument({ applicationId: app.id, title: 'Motiveret ansøgning', category: 'motivated_application' });

	await page.goto(`/applications/${app.id}`);

	await expect(page.getByText('Mit CV')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Motiveret ansøgning' })).toBeVisible();
});

test('can change application status', async ({ page }) => {
	const app = await createApplication({ name: 'Change Status Legat', status: 'draft' });

	await page.goto(`/applications/${app.id}`);
	await page.waitForLoadState('networkidle');

	// Click the status badge button to open status editor
	await page.getByRole('button', { name: 'Kladde' }).click();

	// Select "I gang" (in_progress)
	await page.selectOption('select', 'in_progress');

	// Status badge updates (select closes, badge button shows new status)
	await expect(page.getByRole('button', { name: 'I gang' })).toBeVisible();
});

test('can create a new document via modal', async ({ page }) => {
	const app = await createApplication({ name: 'Create Doc Legat' });

	await page.goto(`/applications/${app.id}`);
	await page.waitForLoadState('networkidle');

	// Open the modal
	await page.getByRole('button', { name: 'Nyt dokument' }).click();

	// Fill in document title
	await page.getByLabel('Titel').fill('Mit Anbefalingsbrev');

	// Create document - should redirect to editor
	await page.getByRole('button', { name: 'Opret' }).click();

	await expect(page).toHaveURL(/\/applications\/\d+\/docs\/\d+/);
});

test('can rename a document', async ({ page }) => {
	const app = await createApplication({ name: 'Rename Doc Test' });
	await createDocument({ applicationId: app.id, title: 'Gammelt Navn' });

	await page.goto(`/applications/${app.id}`);
	await page.waitForLoadState('networkidle');

	// Click rename button (pencil icon, title="Omdøb")
	await page.getByTitle('Omdøb').click();

	const input = page.locator('input.rounded.border-primary-300');
	await input.clear();
	await input.fill('Nyt Navn');
	await page.getByRole('button', { name: 'Gem' }).click();

	await expect(page.getByText('Nyt Navn')).toBeVisible();
	await expect(page.getByText('Gammelt Navn')).not.toBeVisible();
});

test('can delete a document', async ({ page }) => {
	const app = await createApplication({ name: 'Delete Doc Test' });
	await createDocument({ applicationId: app.id, title: 'Slet Mig' });

	await page.goto(`/applications/${app.id}`);
	await page.waitForLoadState('networkidle');
	await expect(page.getByText('Slet Mig')).toBeVisible();

	// Accept the confirm dialog and delete
	page.on('dialog', (dialog) => dialog.accept());
	await page.getByTitle('Slet').click();

	await expect(page.getByText('Slet Mig')).not.toBeVisible();
	await expect(page.getByText('Ingen dokumenter endnu')).toBeVisible();
});

test('can delete an application and return to dashboard', async ({ page }) => {
	const app = await createApplication({ name: 'Slet Ansøgning Test' });

	await page.goto(`/applications/${app.id}`);
	await page.waitForLoadState('networkidle');

	page.on('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'Slet ansøgning' }).click();

	await expect(page).toHaveURL('/');
	await expect(page.getByText('Slet Ansøgning Test')).not.toBeVisible();
});

test('"Tilbage til oversigt" link navigates to dashboard', async ({ page }) => {
	const app = await createApplication({ name: 'Back Link Test' });

	await page.goto(`/applications/${app.id}`);
	await page.getByRole('link', { name: /Tilbage til oversigt/ }).click();

	await expect(page).toHaveURL('/');
});
