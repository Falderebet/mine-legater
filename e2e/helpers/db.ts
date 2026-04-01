const BASE_URL = 'http://localhost:5173';

/**
 * Clears all data via the server-side reset API.
 * Uses the server's own DB connection to avoid cross-process SQLite conflicts.
 * Call this in beforeEach to ensure test isolation.
 */
export async function clearDatabase() {
	const res = await fetch(`${BASE_URL}/api/test/reset`, { method: 'POST' });
	if (!res.ok) {
		throw new Error(`Failed to reset database: ${res.status} ${await res.text()}`);
	}
}
