/**
 * Demo walkthrough script for Mine Legater.
 * Records a video tour of all major features.
 *
 * Run with: npx playwright test --config=playwright.demo.config.ts
 * Video is saved to demo-output/
 */

import { test, expect } from '@playwright/test';
import { clearDatabase } from '../helpers/db';
import { createApplication, createDocument } from '../helpers/api';

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('Mine Legater — full feature demo', async ({ page }) => {
	test.setTimeout(180000);
	await clearDatabase();

	// ── 1. Empty dashboard ──────────────────────────────────────────────────
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await pause(1500);

	await expect(page.getByText('Ingen ansøgninger endnu')).toBeVisible();
	await pause(1200);

	// ── 2. Navigate to new application wizard ───────────────────────────────
	await page.getByRole('link', { name: 'Opret ny ansøgning' }).first().click();
	await page.waitForLoadState('networkidle');
	await pause(1000);

	// ── 3. Wizard Step 1: Basic info ─────────────────────────────────────────
	await expect(page.getByLabel('Navn på legat/stipendium')).toBeVisible();

	// Show that "Næste" is disabled without a name
	await expect(page.getByRole('button', { name: 'Næste' })).toBeDisabled();
	await pause(800);

	await page.getByLabel('Navn på legat/stipendium').fill('Augustinus Fonden');
	await pause(600);
	await page.getByLabel('Ansøgningsfrist (valgfrit)').fill('2025-06-15');
	await pause(600);
	await page
		.getByLabel('URL til legatopslag (valgfrit)')
		.fill('https://www.augustinusfonden.dk/ansoeg');
	await pause(800);

	await page.getByRole('button', { name: 'Næste' }).click();
	await page.waitForLoadState('networkidle');
	await pause(1000);

	// ── 4. Wizard Step 2: AI analysis ────────────────────────────────────────
	await expect(page.getByRole('heading', { name: 'AI-analyse af legatopslag' })).toBeVisible();
	await pause(1500);
	// Skip AI (no real key in demo env)
	await page.getByRole('button', { name: 'Næste' }).click();
	await pause(800);

	// ── 5. Wizard Step 3: Document selection ─────────────────────────────────
	await expect(page.getByRole('heading', { name: 'Vælg dokumenter' })).toBeVisible();
	await pause(800);

	await page.getByLabel('Motiveret ansøgning').check();
	await pause(400);
	await page.getByLabel('CV').check();
	await pause(400);
	await page.getByLabel('Budget').check();
	await pause(600);

	await expect(page.getByText('Valgte dokumenter (3)')).toBeVisible();
	await pause(800);

	await page.getByRole('button', { name: 'Næste' }).click();
	await pause(800);

	// ── 6. Wizard Step 4: Document sources ───────────────────────────────────
	await expect(page.getByRole('heading', { name: 'Dokumentkilder' })).toBeVisible();
	await pause(1500);

	await page.getByRole('button', { name: 'Næste' }).click();
	await pause(800);

	// ── 7. Wizard Step 5: Review & create ────────────────────────────────────
	await expect(page.getByRole('heading', { name: 'Gennemse og opret' })).toBeVisible();
	await expect(page.getByText('Augustinus Fonden').first()).toBeVisible();
	await expect(page.getByText('Motiveret ansøgning').first()).toBeVisible();
	await expect(page.getByText('CV').first()).toBeVisible();
	await expect(page.getByText('Budget').first()).toBeVisible();
	await pause(1500);

	await page.getByRole('button', { name: 'Opret ansøgning' }).click();
	await page.waitForURL(/\/applications\/\d+/);
	await page.waitForLoadState('networkidle');
	await pause(1200);

	// ── 8. Application detail page ────────────────────────────────────────────
	await expect(page.getByRole('heading', { name: 'Augustinus Fonden' })).toBeVisible();
	await expect(page.getByText('Kladde')).toBeVisible();
	await pause(1000);

	// Show documents list
	await expect(page.getByRole('link', { name: /Motiveret ansøgning/ }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: /CV/ }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: /Budget/ }).first()).toBeVisible();
	await pause(1000);

	// ── 9. Change application status ─────────────────────────────────────────
	await page.getByRole('button', { name: 'Kladde' }).click();
	await pause(600);
	await page.selectOption('select', 'in_progress');
	await page.waitForLoadState('networkidle');
	await expect(page.getByRole('button', { name: 'I gang' })).toBeVisible();
	await pause(1000);

	// ── 10. Create a new document via modal ───────────────────────────────────
	await page.getByRole('button', { name: 'Nyt dokument' }).click();
	await pause(600);
	await page.getByLabel('Titel').fill('Projektbeskrivelse');
	await pause(600);
	await page.getByRole('button', { name: 'Opret' }).click();
	await page.waitForURL(/\/applications\/\d+\/docs\/\d+/);
	await page.waitForLoadState('networkidle');
	await pause(1200);

	// ── 11. Document editor ───────────────────────────────────────────────────
	await expect(page.getByRole('heading', { name: 'Projektbeskrivelse' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Eksportér PDF' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Gem som skabelon' })).toBeVisible();
	await pause(1000);

	// Type in the rich text editor
	const editor = page.locator('.ProseMirror');
	await editor.click();
	await pause(400);
	await editor.pressSequentially(
		'Dette projekt sigter mod at styrke dansk kulturarv gennem digital formidling.',
		{ delay: 30 }
	);
	await pause(800);

	// Show auto-save
	await expect(page.getByText('Gemt')).toBeVisible({ timeout: 5000 });
	await pause(1200);

	// ── 12. Navigate back to application detail ───────────────────────────────
	await page.getByRole('link', { name: /Augustinus Fonden/ }).click();
	await page.waitForLoadState('networkidle');
	await pause(1000);

	// ── 13. Rename a document ─────────────────────────────────────────────────
	await page.getByTitle('Omdøb').first().click();
	await pause(400);
	const renameInput = page.locator('input.rounded.border-primary-300');
	await renameInput.clear();
	await renameInput.fill('Motiveret ansøgning (opdateret)');
	await pause(400);
	await page.getByRole('button', { name: 'Gem' }).click();
	await page.waitForLoadState('networkidle');
	await expect(page.getByText('Motiveret ansøgning (opdateret)')).toBeVisible();
	await pause(1000);

	// ── 14. Back to dashboard — populate with more apps ───────────────────────
	await page.getByRole('link', { name: /Tilbage til oversigt/ }).click();
	await page.waitForLoadState('networkidle');
	await pause(800);

	// Seed additional applications via API to show dashboard filtering
	await createApplication({ name: 'Carlsberg Fondet', status: 'submitted' });
	await createApplication({ name: 'Tuborgfondet', status: 'accepted' });
	await createApplication({ name: 'Ole Kirks Fond', status: 'rejected' });
	await createApplication({ name: 'Novo Nordisk Fonden', status: 'draft' });

	await page.reload();
	await page.waitForLoadState('networkidle');
	await pause(1200);

	// ── 15. Dashboard filtering ────────────────────────────────────────────────
	await expect(page.getByText('Augustinus Fonden')).toBeVisible();
	await expect(page.getByText('Carlsberg Fondet')).toBeVisible();
	await pause(800);

	// Filter by "Indsendt"
	await page.getByRole('button', { name: 'Indsendt' }).click();
	await pause(800);
	await expect(page.getByText('Carlsberg Fondet')).toBeVisible();
	await expect(page.getByText('Augustinus Fonden')).not.toBeVisible();
	await pause(1000);

	// Filter by "Accepteret"
	await page.getByRole('button', { name: 'Accepteret' }).click();
	await pause(800);
	await expect(page.getByText('Tuborgfondet')).toBeVisible();
	await pause(1000);

	// Show all again
	await page.getByRole('button', { name: 'Alle' }).click();
	await pause(1000);

	// ── 16. Profile / Templates page ──────────────────────────────────────────
	// Navigate to profile by saving a template first
	const appDetail = await createApplication({ name: 'Skabelon Test Legat' });
	const templateDoc = await createDocument({
		applicationId: appDetail.id,
		title: 'Standard CV',
		type: 'rich_text',
		category: 'cv'
	});

	// Save as template via editor
	await page.goto(`/applications/${appDetail.id}/docs/${templateDoc.id}`);
	await page.waitForLoadState('networkidle');
	await pause(800);

	// Handle the prompt() dialog for template name
	page.once('dialog', async (dialog) => {
		await dialog.accept('Standard CV');
	});
	await page.getByRole('button', { name: 'Gem som skabelon' }).click();
	await pause(1000);

	// Navigate to profile page
	await page.goto('/profile');
	await page.waitForLoadState('networkidle');
	await pause(1500);

	await expect(page.getByText('Standard CV')).toBeVisible();
	await pause(1200);

	// ── 17. Final: back to dashboard overview ─────────────────────────────────
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await pause(2000);
});
