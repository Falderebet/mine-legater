import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { applications } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(applications).where(eq(applications.id, Number(params.id)));
	if (!result.length) throw error(404, 'Ansøgning ikke fundet');
	return json(result[0]);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const result = await db
		.update(applications)
		.set({ ...body, updatedAt: new Date().toISOString() })
		.where(eq(applications.id, Number(params.id)))
		.returning();
	if (!result.length) throw error(404, 'Ansøgning ikke fundet');
	return json(result[0]);
};

export const DELETE: RequestHandler = async ({ params }) => {
	await db.delete(applications).where(eq(applications.id, Number(params.id)));
	return new Response(null, { status: 204 });
};
