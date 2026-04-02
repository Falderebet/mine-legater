import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { applications } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (Number.isNaN(id)) throw error(400, 'Ugyldigt ID');
	const result = await db.select().from(applications).where(eq(applications.id, id));
	if (!result.length) throw error(404, 'Ansøgning ikke fundet');
	return json(result[0]);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (Number.isNaN(id)) throw error(400, 'Ugyldigt ID');
	const body = await request.json();
	const { name, url, status, deadline, notes, scrapedInfo, interviewCompleted } = body;
	const result = await db
		.update(applications)
		.set({
			...(name !== undefined && { name }),
			...(url !== undefined && { url }),
			...(status !== undefined && { status }),
			...(deadline !== undefined && { deadline }),
			...(notes !== undefined && { notes }),
			...(scrapedInfo !== undefined && { scrapedInfo }),
			...(interviewCompleted !== undefined && { interviewCompleted }),
			updatedAt: new Date().toISOString()
		})
		.where(eq(applications.id, id))
		.returning();
	if (!result.length) throw error(404, 'Ansøgning ikke fundet');
	return json(result[0]);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (Number.isNaN(id)) throw error(400, 'Ugyldigt ID');
	const result = await db.delete(applications).where(eq(applications.id, id)).returning();
	if (!result.length) throw error(404, 'Ansøgning ikke fundet');
	return new Response(null, { status: 204 });
};
