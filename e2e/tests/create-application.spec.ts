import { test, expect } from '@playwright/test';
import { clearDatabase } from '../helpers/db';

test.beforeEach(async () => {
	await clearDatabase();
});

test('wizard step 1: requires name before proceeding', async ({ page }) => {
	await page.goto('/applications/new');
	await page.waitForLoadState('networkidle');

	// "Næste" (Next) button is disabled without a name
	const nextButton = page.getByRole('button', { name: 'Næste' });
	await expect(nextButton).toBeDisabled();

	// Fill in name and button becomes enabled
	await page.getByLabel('Navn på legat/stipendium').fill('Test Legat');
	await expect(nextButton).toBeEnabled();
});

test('full wizard: creates application without documents', async ({ page }) => {
	await page.goto('/applications/new');
	await page.waitForLoadState('networkidle');

	// Step 1: Basic info
	await page.getByLabel('Navn på legat/stipendium').fill('Minimal Legat');
	await page.getByRole('button', { name: 'Næste' }).click();

	// Step 2: AI analysis - skip (no URL provided)
	await expect(page.getByRole('heading', { name: 'AI-analyse af legatopslag' })).toBeVisible();
	await expect(page.getByText('Ingen URL angivet')).toBeVisible();
	await page.getByRole('button', { name: 'Næste' }).click();

	// Step 3: Document selection - skip selecting anything
	await expect(page.getByRole('heading', { name: 'Vælg dokumenter' })).toBeVisible();
	await page.getByRole('button', { name: 'Næste' }).click();

	// Step 4: Document sources - nothing to configure
	await expect(page.getByRole('heading', { name: 'Dokumentkilder' })).toBeVisible();
	await page.getByRole('button', { name: 'Næste' }).click();

	// Step 5: Review
	await expect(page.getByRole('heading', { name: 'Gennemse og opret' })).toBeVisible();
	await expect(page.getByText('Minimal Legat')).toBeVisible();

	// Create application
	await page.getByRole('button', { name: 'Opret ansøgning' }).click();

	// Should redirect to interview page
	await expect(page).toHaveURL(/\/applications\/\d+\/interview/);
	await expect(page.getByRole('heading', { name: 'Personligt interview' })).toBeVisible();
});

test('full wizard: creates application with documents', async ({ page }) => {
	await page.goto('/applications/new');
	await page.waitForLoadState('networkidle');

	// Step 1
	await page.getByLabel('Navn på legat/stipendium').fill('Legat Med Dokumenter');
	await page.getByLabel('Ansøgningsfrist (valgfrit)').fill('2025-12-31');
	await page.getByRole('button', { name: 'Næste' }).click();

	// Step 2: skip AI
	await page.getByRole('button', { name: 'Næste' }).click();

	// Step 3: select Motiveret ansøgning and CV
	await page.getByLabel('Motiveret ansøgning').check();
	await page.getByLabel('CV').check();
	await expect(page.getByText('Valgte dokumenter (2)')).toBeVisible();
	await page.getByRole('button', { name: 'Næste' }).click();

	// Step 4: document sources (default "Opret tom" is pre-selected)
	await page.getByRole('button', { name: 'Næste' }).click();

	// Step 5: review shows the documents
	await expect(page.getByText('Motiveret ansøgning')).toBeVisible();
	await expect(page.getByText('CV')).toBeVisible();

	await page.getByRole('button', { name: 'Opret ansøgning' }).click();

	await expect(page).toHaveURL(/\/applications\/\d+\/interview/);
	await expect(page.getByRole('heading', { name: 'Personligt interview' })).toBeVisible();
});

test('wizard: custom document can be added and removed', async ({ page }) => {
	await page.goto('/applications/new');
	await page.waitForLoadState('networkidle');

	// Navigate to step 3
	await page.getByLabel('Navn på legat/stipendium').fill('Custom Doc Test');
	await page.getByRole('button', { name: 'Næste' }).click();
	await page.getByRole('button', { name: 'Næste' }).click();

	// Add a custom document
	await page.getByLabel('Titel').fill('Anbefalingsbrev');
	await page.getByRole('button', { name: 'Tilføj' }).click();

	await expect(page.getByText('Valgte dokumenter (1)')).toBeVisible();
	await expect(page.locator('input.flex-1.border-none')).toHaveValue('Anbefalingsbrev');

	// Remove the document
	await page.getByTitle('Fjern').click();
	await expect(page.getByText('Valgte dokumenter')).not.toBeVisible();
});

test('wizard: navigate back through steps', async ({ page }) => {
	await page.goto('/applications/new');
	await page.waitForLoadState('networkidle');

	await page.getByLabel('Navn på legat/stipendium').fill('Back Test');
	await page.getByRole('button', { name: 'Næste' }).click();

	await expect(page.getByText('AI-analyse af legatopslag')).toBeVisible();
	await page.getByRole('button', { name: 'Tilbage' }).click();

	// Back to step 1, name is preserved
	await expect(page.getByLabel('Navn på legat/stipendium')).toHaveValue('Back Test');
});

test('created application appears on dashboard', async ({ page }) => {
	await page.goto('/applications/new');
	await page.waitForLoadState('networkidle');

	await page.getByLabel('Navn på legat/stipendium').fill('Dashboard Synlig Legat');
	await page.getByRole('button', { name: 'Næste' }).click();
	await page.getByRole('button', { name: 'Næste' }).click();
	await page.getByRole('button', { name: 'Næste' }).click();
	await page.getByRole('button', { name: 'Næste' }).click();
	await page.getByRole('button', { name: 'Opret ansøgning' }).click();

	await expect(page).toHaveURL(/\/applications\/\d+\/interview/);

	// Go to dashboard
	await page.goto('/');
	await expect(page.getByText('Dashboard Synlig Legat')).toBeVisible();
});
