import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents, applications, interviewResponses } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

/**
 * Test-only endpoint: clears all data from the database.
 * Only available when DATABASE_URL points to a test database (contains "test").
 */
export const POST: RequestHandler = async () => {
	const dbUrl = process.env.DATABASE_URL ?? 'file:local.db';
	if (!dbUrl.includes('test')) {
		error(403, 'Reset endpoint is only available in test mode');
	}

	await db.delete(interviewResponses);
	await db.delete(documents);
	await db.delete(applications);

	return json({ ok: true });
};
