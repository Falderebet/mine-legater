import { describe, it, expect } from 'vitest';

/**
 * This test verifies that pdf.ts can be imported in a non-browser (SSR) environment
 * without crashing. The 500 error on the document editor page was caused by pdfmake's
 * vfs_fonts module failing at import time during SSR.
 */
describe('PDF utils SSR safety', () => {
	it('should be importable without throwing (simulating SSR)', async () => {
		// This will throw if pdfmake initializes eagerly at import time
		// "Cannot read properties of undefined (reading 'vfs')"
		const importPdf = () => import('./pdf');
		await expect(importPdf()).resolves.toBeDefined();
	});

	it('should export the expected functions', async () => {
		const pdf = await import('./pdf');
		expect(typeof pdf.exportRichTextToPdf).toBe('function');
		expect(typeof pdf.exportSpreadsheetToPdf).toBe('function');
	});
});
