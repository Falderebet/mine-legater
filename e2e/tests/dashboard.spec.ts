import { test, expect } from '@playwright/test';
import { clearDatabase } from '../helpers/db';
import { createApplication } from '../helpers/api';

test.beforeEach(async () => {
	await clearDatabase();
});

test('shows empty state when no applications exist', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Ingen ansøgninger endnu')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Opret ny ansøgning' }).first()).toBeVisible();
});

test('shows application cards after creating applications', async ({ page }) => {
	await createApplication({ name: 'Carlsberg Fondet', status: 'draft' });
	await createApplication({ name: 'Augustinus Fonden', status: 'in_progress' });

	await page.goto('/');
	await expect(page.getByText('Carlsberg Fondet')).toBeVisible();
	await expect(page.getByText('Augustinus Fonden')).toBeVisible();
});

test('filter bar filters applications by status', async ({ page }) => {
	await createApplication({ name: 'Kladde ansøgning', status: 'draft' });
	await createApplication({ name: 'Indsendt ansøgning', status: 'submitted' });

	await page.goto('/');
	await page.waitForLoadState('networkidle');

	// Both visible initially
	await expect(page.getByText('Kladde ansøgning')).toBeVisible();
	await expect(page.getByText('Indsendt ansøgning')).toBeVisible();

	// Filter to "Indsendt" (submitted)
	await page.getByRole('button', { name: 'Indsendt' }).click();

	await expect(page.getByText('Indsendt ansøgning')).toBeVisible();
	await expect(page.getByText('Kladde ansøgning')).not.toBeVisible();

	// Reset filter to "Alle" shows both again
	await page.getByRole('button', { name: 'Alle' }).click();
	await expect(page.getByText('Kladde ansøgning')).toBeVisible();
	await expect(page.getByText('Indsendt ansøgning')).toBeVisible();
});

test('clicking application card navigates to detail page', async ({ page }) => {
	const app = await createApplication({ name: 'Test Legat', status: 'draft' });

	await page.goto('/');
	await page.getByRole('link', { name: /Test Legat/ }).click();

	await expect(page).toHaveURL(new RegExp(`/applications/${app.id}`));
});

test('"Opret ny ansøgning" button navigates to new application page', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Opret ny ansøgning' }).first().click();
	await expect(page).toHaveURL('/applications/new');
});
