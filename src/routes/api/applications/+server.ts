import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { applications } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const result = await db.select().from(applications).orderBy(desc(applications.createdAt));
	return json(result);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const result = await db
		.insert(applications)
		.values({
			name: body.name,
			url: body.url || null,
			status: body.status || 'draft',
			deadline: body.deadline || null,
			notes: body.notes || null,
			scrapedInfo: body.scrapedInfo || null
		})
		.returning();
	return json(result[0], { status: 201 });
};
